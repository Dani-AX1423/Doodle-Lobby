"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';

const WhiteboardCanvas = ({
  containerRef,
  roomId,
  canvasType = 'infinite',
  username,
  tool = 'pencil',
  lineWidth = 3,
  color = '#ffffff',
  userColor = '#6366f1',
  zoom = 1,
  panOffset = { x: 0, y: 0 },
  onZoomChange,
  onPanChange,
  onUndoReady,
  onRedoReady,
  externalUndoTrigger,
  externalRedoTrigger,
}) => {
  const canvasRef = useRef(null);
  const outerWrapperRef = useRef(null);
  const { theme } = useTheme();

  // Mode identification
  const isFixedSheet = canvasType === 'fixed-16-9' || canvasType === 'fixed-a4';
  const sheetWidth = canvasType === 'fixed-16-9' ? 1920 : canvasType === 'fixed-a4' ? 1240 : 0;
  const sheetHeight = canvasType === 'fixed-16-9' ? 1080 : canvasType === 'fixed-a4' ? 1754 : 0;
  const sheetTitle = canvasType === 'fixed-16-9' ? '16:9 Widescreen' : canvasType === 'fixed-a4' ? 'A4 Portrait' : 'Infinite Space';

  // Drawing state refs
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isSpacePressedRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef([]);
  const currentStrokeIdRef = useRef('');
  const lastStreamTimeRef = useRef(0);

  // Undo / Redo & Drawing history state
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // Remote streaming strokes map: strokeId -> strokeData
  const remoteStreamingRef = useRef(new Map());

  // Keep historyRef in sync
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const { sendDrawEvent, sendCursorMove, subscribeDrawEvent, subscribeClearCanvas } = useSocket();

  // Helper to convert screen coordinates to untransformed canvas coordinates
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (isFixedSheet) {
      const rawX = (clientX - rect.left) * (canvas.width / rect.width);
      const rawY = (clientY - rect.top) * (canvas.height / rect.height);
      return {
        x: Math.max(0, Math.min(rawX, canvas.width)),
        y: Math.max(0, Math.min(rawY, canvas.height)),
      };
    } else {
      return {
        x: (clientX - rect.left - panOffset.x) / zoom,
        y: (clientY - rect.top - panOffset.y) / zoom,
      };
    }
  }, [isFixedSheet, panOffset, zoom]);

  // Helper to compute normalized canvas-space stroke width (independent of current zoom/scale level)
  const getNormalizedLineWidth = useCallback((currentTool, width) => {
    const isEraser = currentTool === 'eraser';
    const baseWidth = isEraser ? Math.max(width * 6, 24) : (width || 3);
    return baseWidth / (zoom || 1);
  }, [zoom]);

  // Helper to render an individual stroke on a transformed 2D context
  const renderSingleStroke = useCallback((ctx, stroke) => {
    if (!ctx || !stroke) return;

    ctx.save();
    const isEraser = stroke.type === 'eraser';

    // Eraser Rendering Pipeline Alignment
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color || '#ffffff';
    }

    ctx.lineWidth = stroke.lineWidth || (isEraser ? 24 : 3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'pencil' || stroke.type === 'eraser') {
      const points = stroke.points;
      if (points && points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      } else if (stroke.x1 !== undefined && stroke.x2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(stroke.x1, stroke.y1);
        ctx.lineTo(stroke.x2, stroke.y2);
        ctx.stroke();
      }
    } else if (stroke.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(stroke.x1, stroke.y1);
      ctx.lineTo(stroke.x2, stroke.y2);
      ctx.stroke();
    } else if (stroke.type === 'rectangle') {
      const w = stroke.x2 - stroke.x1;
      const h = stroke.y2 - stroke.y1;
      ctx.strokeRect(stroke.x1, stroke.y1, w, h);
    } else if (stroke.type === 'circle') {
      const radiusX = Math.abs(stroke.x2 - stroke.x1) / 2;
      const radiusY = Math.abs(stroke.y2 - stroke.y1) / 2;
      const centerX = Math.min(stroke.x1, stroke.x2) + radiusX;
      const centerY = Math.min(stroke.y1, stroke.y2) + radiusY;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Always reset ctx.globalCompositeOperation = 'source-over' after drawing eraser paths
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }, []);

  // Synchronous Canvas Redraw Function (Clears and re-renders all stored strokes immediately)
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isFixedSheet) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panOffset.x, dpr * panOffset.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // 1. Draw committed history strokes synchronously from historyRef.current
    const strokes = historyRef.current || [];
    for (let i = 0; i < strokes.length; i++) {
      renderSingleStroke(ctx, strokes[i]);
    }

    // 2. Draw remote real-time streaming strokes
    remoteStreamingRef.current.forEach((stroke) => {
      renderSingleStroke(ctx, stroke);
    });

    // 3. Draw active local stroke preview with identical normalized lineWidth
    if (isDrawingRef.current && currentPathRef.current.length > 0) {
      const isEraser = tool === 'eraser';
      const localPreviewStroke = {
        type: tool,
        points: currentPathRef.current,
        x1: currentPathRef.current[0].x,
        y1: currentPathRef.current[0].y,
        x2: currentPathRef.current[currentPathRef.current.length - 1].x,
        y2: currentPathRef.current[currentPathRef.current.length - 1].y,
        color: isEraser ? 'rgba(0,0,0,1)' : color,
        lineWidth: getNormalizedLineWidth(tool, lineWidth),
      };
      renderSingleStroke(ctx, localPreviewStroke);
    }
  }, [isFixedSheet, zoom, panOffset, renderSingleStroke, tool, color, lineWidth, getNormalizedLineWidth]);

  // Canvas size management
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isFixedSheet) {
      canvas.width = sheetWidth;
      canvas.height = sheetHeight;
      redrawCanvas();
    } else {
      const updateSize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        redrawCanvas();
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [isFixedSheet, sheetWidth, sheetHeight, redrawCanvas]);

  // Trigger redraw on zoom or pan changes
  useEffect(() => {
    redrawCanvas();
  }, [zoom, panOffset, redrawCanvas]);

  // Remote Socket Subscriptions (streaming strokes, undo, clear)
  useEffect(() => {
    const unsubDraw = subscribeDrawEvent((rawEvent) => {
      let data = rawEvent;
      if (typeof rawEvent === 'string') {
        try {
          data = JSON.parse(rawEvent);
        } catch (e) {
          data = rawEvent;
        }
      }
      if (!data) return;

      // Remote Undo Event
      if (data.type === 'undo') {
        const targetId = data.strokeId;
        const updated = historyRef.current.filter((s) => s.strokeId !== targetId);
        historyRef.current = updated;
        setHistory(updated);
        redrawCanvas();
        return;
      }

      // Real-time live stroke streaming
      if (data.isStreaming && data.strokeId) {
        remoteStreamingRef.current.set(data.strokeId, data);
        redrawCanvas();
        return;
      }

      // Finalized stroke completed by remote peer
      if (data.strokeId) {
        remoteStreamingRef.current.delete(data.strokeId);
      }
      historyRef.current = [...historyRef.current, data];
      setHistory(historyRef.current);
      redrawCanvas();
    });

    const unsubClear = subscribeClearCanvas(() => {
      historyRef.current = [];
      setHistory([]);
      undoStackRef.current = [];
      redoStackRef.current = [];
      remoteStreamingRef.current.clear();
      redrawCanvas();
    });

    return () => {
      unsubDraw();
      unsubClear();
    };
  }, [subscribeDrawEvent, subscribeClearCanvas, redrawCanvas]);

  // Local Undo Action
  const performUndo = useCallback(() => {
    const currentHist = historyRef.current;
    if (currentHist.length === 0) return;

    let lastIndex = -1;
    for (let i = currentHist.length - 1; i >= 0; i--) {
      if (!currentHist[i].username || currentHist[i].username === username) {
        lastIndex = i;
        break;
      }
    }
    if (lastIndex === -1) lastIndex = currentHist.length - 1;

    const strokeToUndo = currentHist[lastIndex];
    redoStackRef.current.push(strokeToUndo);

    const nextHistory = [...currentHist];
    nextHistory.splice(lastIndex, 1);
    historyRef.current = nextHistory;
    setHistory(nextHistory);

    if (sendDrawEvent) {
      sendDrawEvent({
        type: 'undo',
        strokeId: strokeToUndo.strokeId,
        username,
      });
    }

    redrawCanvas();
  }, [username, sendDrawEvent, redrawCanvas]);

  // Local Redo Action
  const performRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const strokeToRedo = redoStackRef.current.pop();

    const nextHistory = [...historyRef.current, strokeToRedo];
    historyRef.current = nextHistory;
    setHistory(nextHistory);

    if (sendDrawEvent) {
      sendDrawEvent(strokeToRedo);
    }

    redrawCanvas();
  }, [sendDrawEvent, redrawCanvas]);

  // Expose Undo/Redo handles
  useEffect(() => {
    if (onUndoReady) onUndoReady(performUndo);
    if (onRedoReady) onRedoReady(performRedo);
  }, [onUndoReady, onRedoReady, performUndo, performRedo]);

  // Keyboard Shortcuts (Space Pan, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      if (isInput) return;

      if (e.code === 'Space' && !e.repeat) {
        isSpacePressedRef.current = true;
        const target = canvasRef.current || outerWrapperRef.current;
        if (target) target.style.cursor = 'grab';
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          performRedo();
        } else {
          performUndo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        performRedo();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        const target = canvasRef.current || outerWrapperRef.current;
        if (target) target.style.cursor = 'crosshair';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [performUndo, performRedo]);

  // POINTER-ANCHORED ZOOM (Anchor Zoom at Mouse Location)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = outerWrapperRef.current;
    const target = isFixedSheet ? wrapper : canvas;
    if (!target) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(Math.max(zoom * zoomFactor, 0.2), 5);

      const activeCanvas = canvasRef.current;
      if (!activeCanvas) return;
      const rect = activeCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - panOffset.x) * (newScale / zoom);
      const newPanY = mouseY - (mouseY - panOffset.y) * (newScale / zoom);

      if (onPanChange) onPanChange({ x: newPanX, y: newPanY });
      if (onZoomChange) onZoomChange(newScale);
    };

    target.addEventListener('wheel', handleWheel, { passive: false });
    return () => target.removeEventListener('wheel', handleWheel);
  }, [isFixedSheet, zoom, panOffset, onZoomChange, onPanChange]);

  // Workspace pointer down (for background panning in sheet mode)
  const handleWorkspacePointerDown = (e) => {
    if (e.target !== canvasRef.current) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  // Canvas Pointer Handlers (Pan & Real-time Stroke Drawing)
  const handlePointerDown = (e) => {
    // Pan via Space+Click OR Middle Click (button === 1)
    if (isSpacePressedRef.current || e.button === 1) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = 'grabbing';
      return;
    }

    if (e.button !== 0) return; // Only primary button draws

    const canvasCoords = screenToCanvas(e.clientX, e.clientY);

    isDrawingRef.current = true;
    currentStrokeIdRef.current = `${username || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    currentPathRef.current = [canvasCoords];
    lastStreamTimeRef.current = Date.now();

    redrawCanvas();
  };

  const handlePointerMove = (e) => {
    // Transform coordinates for multiplayer cursor broadcast (world coordinates)
    const canvas = canvasRef.current;
    if (canvas && sendCursorMove && username) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - panOffset.x) / zoom;
      const worldY = (mouseY - panOffset.y) / zoom;

      sendCursorMove({
        x: worldX,
        y: worldY,
        username,
        color: userColor,
        userColor,
      });
    }

    // Handle active pan drag
    if (isPanningRef.current) {
      const nextPan = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      };
      if (onPanChange) onPanChange(nextPan);
      return;
    }

    if (!isDrawingRef.current) return;

    const canvasCoords = screenToCanvas(e.clientX, e.clientY);
    currentPathRef.current.push(canvasCoords);

    // Real-Time Stroke Streaming: emit path updates live (~16ms throttle for 60fps)
    const now = Date.now();
    if (now - lastStreamTimeRef.current > 16 && (tool === 'pencil' || tool === 'eraser')) {
      lastStreamTimeRef.current = now;
      if (sendDrawEvent) {
        sendDrawEvent({
          strokeId: currentStrokeIdRef.current,
          type: tool,
          points: currentPathRef.current,
          color: tool === 'eraser' ? 'rgba(0,0,0,1)' : color,
          lineWidth: getNormalizedLineWidth(tool, lineWidth),
          username,
          isStreaming: true,
        });
      }
    }

    redrawCanvas();
  };

  // STROKE DISAPPEARING ON RELEASE (Instant Synchronous Repaint Fix)
  const handlePointerUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = isSpacePressedRef.current ? 'grab' : 'crosshair';
      }
      return;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const points = currentPathRef.current;
    if (!points || points.length === 0) return;

    const strokeId = currentStrokeIdRef.current;
    let finalizedStroke = null;
    const isEraser = tool === 'eraser';
    const normalizedLineWidth = getNormalizedLineWidth(tool, lineWidth);

    if (tool === 'pencil' || tool === 'eraser') {
      finalizedStroke = {
        strokeId,
        type: tool,
        points,
        color: isEraser ? 'rgba(0,0,0,1)' : color,
        lineWidth: normalizedLineWidth,
        username,
        isStreaming: false,
      };
    } else {
      finalizedStroke = {
        strokeId,
        type: tool,
        x1: points[0].x,
        y1: points[0].y,
        x2: points[points.length - 1].x,
        y2: points[points.length - 1].y,
        color,
        lineWidth: normalizedLineWidth,
        username,
        isStreaming: false,
      };
    }

    if (finalizedStroke) {
      // 1. Instantly append to historyRef stack so history is synchronously up-to-date
      historyRef.current = [...historyRef.current, finalizedStroke];
      // 2. Schedule React state update
      setHistory(historyRef.current);
      redoStackRef.current = [];

      // 3. Emit stroke payload to socket with standardized normalized lineWidth
      if (sendDrawEvent) {
        sendDrawEvent(finalizedStroke);
      }
    }

    currentPathRef.current = [];
    currentStrokeIdRef.current = '';

    // 4. IMMEDIATELY execute full canvas repaint synchronously before returning
    redrawCanvas();
  }, [tool, color, lineWidth, username, getNormalizedLineWidth, sendDrawEvent, redrawCanvas]);

  // Global pointerup listener to ensure stroke commits even if pointer leaves canvas
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDrawingRef.current) {
        handlePointerUp();
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [handlePointerUp]);

  // Clean solid background color (no grid lines, no SVG patterns)
  const containerBg = theme === 'dark' ? 'bg-[#121214]' : 'bg-[#F8F9FA]';

  return (
    <div
      ref={outerWrapperRef}
      onPointerDown={handleWorkspacePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none transition-colors duration-200 ${containerBg} ${
        isFixedSheet ? 'flex items-center justify-center' : ''
      }`}
    >
      {isFixedSheet ? (
        /* Fixed Sheet (Paper Document) Mode */
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanningRef.current ? 'none' : 'transform 50ms ease-out',
          }}
          className="relative shrink-0"
        >
          {/* Dimension & Sheet Badge */}
          <div
            className={`absolute -top-7 left-0 flex items-center gap-2 text-[11px] font-mono select-none px-1 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            <span className="font-semibold">{sheetTitle}</span>
            <span>•</span>
            <span>{sheetWidth} × {sheetHeight}</span>
            <span>•</span>
            <span className="text-indigo-500 font-bold">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Centered Styled Paper Card (Solid clean surface, no grid lines) */}
          <div
            className={`rounded-lg shadow-2xl border transition-colors ${
              theme === 'dark'
                ? 'bg-[#18181b] border-zinc-800 shadow-black/70'
                : 'bg-white border-zinc-200 shadow-zinc-300/80'
            }`}
            style={{
              width: `${sheetWidth}px`,
              height: `${sheetHeight}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={sheetWidth}
              height={sheetHeight}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onMouseUp={handlePointerUp}
              className="w-full h-full block touch-none cursor-crosshair rounded-lg"
            />
          </div>
        </div>
      ) : (
        /* Infinite Space (Unbounded Workspace) Mode - Solid clean surface, no grid lines */
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onMouseUp={handlePointerUp}
          className="w-full h-full touch-none block cursor-crosshair"
        />
      )}
    </div>
  );
};

export default WhiteboardCanvas;