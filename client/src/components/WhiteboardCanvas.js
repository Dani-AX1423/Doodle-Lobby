"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';

const WhiteboardCanvas = ({
  roomId,
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
  const contextRef = useRef(null);
  const { theme, showGrid } = useTheme();

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

  // Helper to convert screen mouse coords to world/canvas coords
  const screenToCanvas = useCallback((screenX, screenY) => {
    return {
      x: (screenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom,
    };
  }, [panOffset, zoom]);

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

  // Master Redraw function with HiDPI and Pan & Zoom transform
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Reset transform and clear viewport
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport camera transform: scale & pan
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panOffset.x, dpr * panOffset.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
  }, [zoom, panOffset, renderSingleStroke, tool, color, lineWidth]);

  // Canvas size management with devicePixelRatio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
  }, [redraw]);

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
          // Remove last stroke from that user if no strokeId
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

      // Completed stroke
      if (data.strokeId) {
        remoteStreamingRef.current.delete(data.strokeId);
      }
      setHistory((prev) => [...prev, data]);
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

  // Redraw when history changes
  useEffect(() => {
    redraw();
  }, [history, redraw]);

  // Perform Undo
  const performUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;

    // Find the latest stroke by current user, or top stroke
    let targetIndex = -1;
    for (let i = historyRef.current.length - 1; i >= 0; i--) {
      if (!username || historyRef.current[i].username === username) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex === -1) targetIndex = historyRef.current.length - 1;

    const strokeToUndo = historyRef.current[targetIndex];
    redoStackRef.current.push(strokeToUndo);

    setHistory((prev) => {
      const next = [...prev];
      next.splice(targetIndex, 1);
      return next;
    });

    // Notify peers
    if (sendDrawEvent) {
      sendDrawEvent({
        type: 'undo',
        strokeId: strokeToUndo.strokeId,
        username,
      });
    }
  }, [username, sendDrawEvent]);

  // Perform Redo
  const performRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const strokeToRestore = redoStackRef.current.pop();

    setHistory((prev) => [...prev, strokeToRestore]);

    if (sendDrawEvent) {
      sendDrawEvent({
        ...strokeToRestore,
        isStreaming: false,
      });
    }
  }, [sendDrawEvent]);

  // Expose undo/redo triggers to parent toolbar
  useEffect(() => {
    if (onUndoReady) onUndoReady(performUndo);
    if (onRedoReady) onRedoReady(performRedo);
  }, [performUndo, performRedo, onUndoReady, onRedoReady]);

  // Trigger from toolbar buttons if passed
  useEffect(() => {
    if (externalUndoTrigger) performUndo();
  }, [externalUndoTrigger, performUndo]);

  useEffect(() => {
    if (externalRedoTrigger) performRedo();
  }, [externalRedoTrigger, performRedo]);

  // Keyboard Shortcuts: Spacebar (Pan mode), Ctrl+Z (Undo), Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' && !isSpacePressedRef.current) {
        isSpacePressedRef.current = true;
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = 'grab';
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z or Cmd+Y
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        performRedo();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = isDrawingRef.current ? 'crosshair' : 'default';
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Trackpad pinch or mouse wheel
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 5.0);

      // Adjust panOffset so point under mouse remains stationary
      const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);

      if (onZoomChange) onZoomChange(newZoom);
      if (onPanChange) onPanChange({ x: newPanX, y: newPanY });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, panOffset, onZoomChange, onPanChange]);

  // Pointer Handlers (Pan & Real-time Stroke Drawing)
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pan via Space+Click OR Middle Click (button === 1)
    if (isSpacePressedRef.current || e.button === 1) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (e.button !== 0) return; // Only primary button draws

    const rect = canvas.getBoundingClientRect();
    const canvasCoords = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);

    isDrawingRef.current = true;
    currentStrokeIdRef.current = `${username || 'anon'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    currentPathRef.current = [canvasCoords];
    lastStreamTimeRef.current = Date.now();

    redraw();
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Broadcast multiplayer cursor position in screen coordinates
    if (sendCursorMove && username) {
      sendCursorMove({
        x: e.clientX,
        y: e.clientY,
        username,
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

    const canvasCoords = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
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
      // Clear redo stack on new action
      redoStackRef.current = [];

      if (sendDrawEvent) {
        sendDrawEvent(finalizedStroke);
      }
    }

    currentPathRef.current = [];
    currentStrokeIdRef.current = '';
    redraw();
  };

  const gridClass = showGrid
    ? theme === 'dark'
      ? 'canvas-grid-dark'
      : 'canvas-grid-light'
    : theme === 'dark'
    ? 'bg-[#121214]'
    : 'bg-[#F8F9FA]';

  return (
    <div 
      className={`absolute inset-0 w-full h-full overflow-hidden select-none transition-colors duration-200 ${gridClass}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full touch-none block cursor-crosshair"
      />
    </div>
  );
};

export default WhiteboardCanvas;