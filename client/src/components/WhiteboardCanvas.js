"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const WhiteboardCanvas = ({
  roomId,
  username,
  tool = 'pencil',
  lineWidth = 2,
  color = '#ffffff',
  userColor = '#6366f1',
}) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef([]);
  const canvasSnapshotRef = useRef(null);

  const { sendDrawEvent, sendCursorMove, subscribeDrawEvent, subscribeClearCanvas } = useSocket();

  // Helper to draw a single stroke onto a 2D context
  const renderStroke = useCallback((ctx, stroke) => {
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
      ctx.lineWidth = stroke.lineWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    if (stroke.type === 'pencil' || stroke.type === 'eraser') {
      if (stroke.points && stroke.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
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
      const width = stroke.x2 - stroke.x1;
      const height = stroke.y2 - stroke.y1;
      ctx.strokeRect(stroke.x1, stroke.y1, width, height);
    } else if (stroke.type === 'circle') {
      const radiusX = Math.abs(stroke.x2 - stroke.x1) / 2;
      const radiusY = Math.abs(stroke.y2 - stroke.y1) / 2;
      const centerX = Math.min(stroke.x1, stroke.x2) + radiusX;
      const centerY = Math.min(stroke.y1, stroke.y2) + radiusY;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  // Initialize and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Save previous content if any
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx && canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      contextRef.current = ctx;

      // Restore previous content
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    };

    initCanvas();
    window.addEventListener('resize', initCanvas);

    return () => {
      window.removeEventListener('resize', initCanvas);
    };
  }, []);

  // Subscribe to remote draw events
  useEffect(() => {
    const unsubscribeDraw = subscribeDrawEvent((stroke) => {
      const ctx = contextRef.current;
      if (ctx && stroke) {
        renderStroke(ctx, stroke);
      }
    });

    const unsubscribeClear = subscribeClearCanvas(() => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (canvas && ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    });

    return () => {
      unsubscribeDraw();
      unsubscribeClear();
    };
  }, [subscribeDrawEvent, subscribeClearCanvas, renderStroke]);

  // Mouse / Pointer drawing handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only primary button
    const coords = getCoordinates(e);
    isDrawingRef.current = true;
    startPosRef.current = coords;
    currentPathRef.current = [coords];

    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.save();
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 24;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      }
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerMove = (e) => {
    const coords = getCoordinates(e);

    // Throttle cursor position broadcast
    if (sendCursorMove && username) {
      sendCursorMove({
        x: e.clientX,
        y: e.clientY,
        username,
        userColor,
      });
    }

    if (!isDrawingRef.current) return;

    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    currentPathRef.current.push(coords);

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.save();
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 24;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
      }
      const points = currentPathRef.current;
      const prev = points[points.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.restore();
    } else {
      // For shapes (line, rect, circle), restore clean snapshot and preview
      if (canvasSnapshotRef.current) {
        ctx.putImageData(canvasSnapshotRef.current, 0, 0);
      }
      renderStroke(ctx, {
        type: tool,
        x1: startPosRef.current.x,
        y1: startPosRef.current.y,
        x2: coords.x,
        y2: coords.y,
        color,
        lineWidth,
      });
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const coords = getCoordinates(e);
    const startPos = startPosRef.current;

    let strokeData = null;

    if (tool === 'pencil' || tool === 'eraser') {
      strokeData = {
        type: tool,
        points: currentPathRef.current,
        color: tool === 'eraser' ? 'transparent' : color,
        lineWidth: tool === 'eraser' ? 24 : lineWidth,
        username,
      };
    } else {
      strokeData = {
        type: tool,
        x1: startPos.x,
        y1: startPos.y,
        x2: coords.x,
        y2: coords.y,
        color,
        lineWidth,
        username,
      };
    }

    if (strokeData && sendDrawEvent) {
      sendDrawEvent(strokeData);
    }

    currentPathRef.current = [];
    canvasSnapshotRef.current = null;
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full touch-none block"
      />
    </div>
  );
};

export default WhiteboardCanvas;