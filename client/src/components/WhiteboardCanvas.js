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
  const { theme, showGrid } = useTheme();

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

  // Helper to convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (isFixedSheet) {
      // In fixed sheet mode, map screen position directly to fixed canvas dimensions
      const rawX = (clientX - rect.left) * (canvas.width / rect.width);
      const rawY = (clientY - rect.top) * (canvas.height / rect.height);
      return {
        x: Math.max(0, Math.min(rawX, canvas.width)),
        y: Math.max(0, Math.min(rawY, canvas.height)),
      };
    } else {
      // In infinite mode, pan and zoom are applied via 2D context transform
      return {
        x: (clientX - rect.left - panOffset.x) / zoom,
        y: (clientY - rect.top - panOffset.y) / zoom,
      };
    }
  }, [isFixedSheet, panOffset, zoom]);

  // Helper to render an individual stroke on a transformed 2D context
  const renderSingleStroke = useCallback((ctx, stroke) => {
    if (!ctx || !stroke) return;

    ctx.save();
    const isEraser = stroke.type === 'eraser';

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.lineWidth || 24;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color || '#ffffff';
      ctx.lineWidth = stroke.lineWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

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

    ctx.restore();
  }, []);

  // Master Redraw function
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isFixedSheet) {
      // Fixed sheet: canvas dimensions are intrinsic sheetWidth x sheetHeight
      // Scaling and panning are handled smoothly by CSS transform on the card wrapper
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      // Infinite mode: canvas is resized to match viewport, zoom and pan applied to 2D context
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panOffset.x, dpr * panOffset.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // 1. Draw committed history strokes
    const strokes = historyRef.current;
    for (let i = 0; i < strokes.length; i++) {
      renderSingleStroke(ctx, strokes[i]);
    }

    // 2. Draw remote real-time streaming strokes
    remoteStreamingRef.current.forEach((stroke) => {
      renderSingleStroke(ctx, stroke);
    });

    // 3. Draw active local stroke preview
    if (isDrawingRef.current && currentPathRef.current.length > 0) {
      const localPreviewStroke = {
        type: tool,
        points: currentPathRef.current,
        x1: currentPathRef.current[0].x,
        y1: currentPathRef.current[0].y,
        x2: currentPathRef.current[currentPathRef.current.length - 1].x,
        y2: currentPathRef.current[currentPathRef.current.length - 1].y,
        color,
        lineWidth,
      };
      renderSingleStroke(ctx, localPreviewStroke);
    }
  }, [isFixedSheet, zoom, panOffset, renderSingleStroke, tool, color, lineWidth]);

  // Canvas size management
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isFixedSheet) {
      canvas.width = sheetWidth;
      canvas.height = sheetHeight;
      redraw();
    } else {
      const updateSize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        redraw();
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [isFixedSheet, sheetWidth, sheetHeight, redraw]);

  // Trigger redraw on zoom or pan changes
  useEffect(() => {
    redraw();
  }, [zoom, panOffset, redraw]);

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
        setHistory((prev) => {
          if (targetId) {
            return prev.filter((s) => s.strokeId !== targetId);
          }
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].username === data.username) {
              const updated = [...prev];
              updated.splice(i, 1);
              return updated;
            }
          }
          return prev.slice(0, -1);
        });
        return;
      }

      // Real-time live stroke streaming
      if (data.isStreaming && data.strokeId) {
        remoteStreamingRef.current.set(data.strokeId, data);
        redraw();
        return;
      }

      // Finalized stroke completed by remote peer
      if (data.strokeId) {
        remoteStreamingRef.current.delete(data.strokeId);
      }
      setHistory((prev) => [...prev, data]);
      redraw();
    });

    const unsubClear = subscribeClearCanvas(() => {
      setHistory([]);
      undoStackRef.current = [];
      redoStackRef.current = [];
      remoteStreamingRef.current.clear();
      redraw();
    });

    return () => {
      unsubDraw();
      unsubClear();
    };
  }, [subscribeDrawEvent, subscribeClearCanvas, redraw]);

  // Local Undo Action
  const performUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      let lastIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (!prev[i].username || prev[i].username === username) {
          lastIndex = i;
          break;
        }
      }
      if (lastIndex === -1) lastIndex = prev.length - 1;

      const strokeToUndo = prev[lastIndex];
      redoStackRef.current.push(strokeToUndo);

      const nextHistory = [...prev];
      nextHistory.splice(lastIndex, 1);

      if (sendDrawEvent) {
        sendDrawEvent({
          type: 'undo',
          strokeId: strokeToUndo.strokeId,
          username,
        });
      }

      return nextHistory;
    });
  }, [username, sendDrawEvent]);

  // Local Redo Action
  const performRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const strokeToRedo = redoStackRef.current.pop();

    setHistory((prev) => {
      const nextHistory = [...prev, strokeToRedo];
      if (sendDrawEvent) {
        sendDrawEvent(strokeToRedo);
      }
      return nextHistory;
    });
  }, [sendDrawEvent]);

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

  // Wheel Zoom Engine (zooms toward mouse point)
  useEffect(() => {
    const wrapper = outerWrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const rect = wrapper.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Trackpad pinch or mouse wheel
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.15), 5.0);

      // Adjust panOffset so point under mouse remains stationary
      const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

      if (onZoomChange) onZoomChange(newZoom);
      if (onPanChange) onPanChange({ x: newPanX, y: newPanY });
    };

    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', handleWheel);
  }, [zoom, panOffset, onZoomChange, onPanChange]);

  // Broadcast cursor position helper (maps coordinates relative to container bounding box)
  const emitCursorPosition = useCallback((clientX, clientY) => {
    const container = (containerRef && containerRef.current) || outerWrapperRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    if (sendCursorMove && username) {
      sendCursorMove({
        x: relX,
        y: relY,
        username,
        userColor,
        color: userColor,
      });
    }
  }, [containerRef, sendCursorMove, username, userColor]);

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

    redraw();
  };

  const handlePointerMove = (e) => {
    // Broadcast multiplayer cursor relative to container
    emitCursorPosition(e.clientX, e.clientY);

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
          color: tool === 'eraser' ? 'transparent' : color,
          lineWidth: tool === 'eraser' ? 24 : lineWidth,
          username,
          isStreaming: true,
        });
      }
    }

    redraw();
  };

  const handlePointerUp = () => {
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

    if (tool === 'pencil' || tool === 'eraser') {
      finalizedStroke = {
        strokeId,
        type: tool,
        points,
        color: tool === 'eraser' ? 'transparent' : color,
        lineWidth: tool === 'eraser' ? 24 : lineWidth,
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
        lineWidth,
        username,
        isStreaming: false,
      };
    }

    if (finalizedStroke) {
      setHistory((prev) => [...prev, finalizedStroke]);
      redoStackRef.current = [];

      if (sendDrawEvent) {
        sendDrawEvent(finalizedStroke);
      }
    }

    currentPathRef.current = [];
    currentStrokeIdRef.current = '';
    redraw();
  };

  // Outer workspace background class (with grid toggle)
  const gridClass = showGrid
    ? theme === 'dark'
      ? 'canvas-grid-dark'
      : 'canvas-grid-light'
    : theme === 'dark'
    ? 'bg-[#121214]'
    : 'bg-[#F8F9FA]';

  return (
    <div
      ref={outerWrapperRef}
      onPointerDown={handleWorkspacePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none transition-colors duration-200 ${gridClass} ${
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

          {/* Centered Styled Paper Card (Pure clean paper surface without grid lines) */}
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
              className="w-full h-full block touch-none cursor-crosshair rounded-lg"
            />
          </div>
        </div>
      ) : (
        /* Infinite Space (Unbounded Workspace) Mode */
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full touch-none block cursor-crosshair"
        />
      )}
    </div>
  );
};

export default WhiteboardCanvas;