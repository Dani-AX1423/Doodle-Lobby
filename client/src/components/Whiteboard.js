"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../hooks/useSocket';
import Toolbar from './Toolbar';
import WhiteboardCanvas from './WhiteboardCanvas';
import LiveCursors from './LiveCursors';

const Whiteboard = ({ roomId, roomName = 'Collaborative Whiteboard' }) => {
  const router = useRouter();
  const { connected, username, usersInRoom, joinRoom, leaveRoom, clearCanvas } = useSocket();

  const [tool, setTool] = useState('pencil');
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState('#ffffff');
  const [userColor] = useState(() => {
    const palette = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#06b6d4', '#f59e0b'];
    return palette[Math.floor(Math.random() * palette.length)];
  });

  // Join the room on mount
  useEffect(() => {
    if (roomId && username) {
      joinRoom(roomId, username);
    }
    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, username, joinRoom, leaveRoom]);

  // Handle clear canvas
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas for everyone?')) {
      clearCanvas(roomId);
    }
  };

  // Handle PNG export
  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Create an offscreen canvas to combine dark background and drawing
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (exportCtx) {
      // Fill dark aesthetic background
      exportCtx.fillStyle = '#020617';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      // Draw canvas contents
      exportCtx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = `doodlelobby-${roomId || 'canvas'}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleLeave = () => {
    leaveRoom(roomId);
    router.push('/');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />

      {/* Floating Toolbar and Top Navigation */}
      <Toolbar
        roomId={roomId}
        roomName={roomName}
        tool={tool}
        setTool={setTool}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        color={color}
        setColor={setColor}
        onClear={handleClear}
        onExport={handleExport}
        username={username}
        onLeave={handleLeave}
        usersInRoom={usersInRoom}
      />

      {/* Canvas Drawing Area */}
      <WhiteboardCanvas
        roomId={roomId}
        username={username}
        tool={tool}
        lineWidth={lineWidth}
        color={color}
        userColor={userColor}
      />

      {/* Live Remote Cursors Overlay */}
      <LiveCursors username={username} />
    </div>
  );
};

export default Whiteboard;