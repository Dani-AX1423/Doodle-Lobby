"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';
import Toolbar from './Toolbar';
import WhiteboardCanvas from './WhiteboardCanvas';
import LiveCursors from './LiveCursors';
import ZoomWidget from './ZoomWidget';
import SettingsModal from './SettingsModal';

const Whiteboard = ({ roomId, roomName = 'Collaborative Whiteboard' }) => {
  const router = useRouter();
  const { theme, canvasBg } = useTheme();
  const { username, usersInRoom, joinRoom, leaveRoom, clearCanvas } = useSocket();

  // Tool state
  const [tool, setTool] = useState('pencil');
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState(() => (theme === 'dark' ? '#ffffff' : '#18181b'));
  const [userColor] = useState(() => {
    const palette = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#06b6d4', '#f59e0b'];
    return palette[Math.floor(Math.random() * palette.length)];
  });

  // Pan & Zoom Engine State
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Undo / Redo callbacks
  const undoRef = useRef(null);
  const redoRef = useRef(null);

  // Join room on mount
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

  // Adjust default drawing color when theme changes if current color is default black/white
  useEffect(() => {
    setColor((prev) => {
      if (theme === 'dark' && prev === '#18181b') return '#ffffff';
      if (theme === 'light' && prev === '#ffffff') return '#18181b';
      return prev;
    });
  }, [theme]);

  // Zoom Controls
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.15, 5.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.15, 0.2));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Clear Canvas with confirmation
  const handleClear = () => {
    if (typeof window !== 'undefined' && window.confirm('Clear the entire whiteboard for everyone?')) {
      clearCanvas(roomId);
    }
  };

  // Clean PNG Export: Decoupled canvas snapshot with theme background
  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');

    if (ctx) {
      // Fill theme background color
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      // Draw content
      ctx.drawImage(canvas, 0, 0);

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
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* 1. Underlying Drawing Surface (Decoupled Layer) */}
      <WhiteboardCanvas
        roomId={roomId}
        username={username}
        tool={tool}
        lineWidth={lineWidth}
        color={color}
        userColor={userColor}
        zoom={zoom}
        panOffset={panOffset}
        onZoomChange={setZoom}
        onPanChange={setPanOffset}
        onUndoReady={(fn) => { undoRef.current = fn; }}
        onRedoReady={(fn) => { redoRef.current = fn; }}
      />

      {/* 2. Live Remote Multiplayer Cursors */}
      <LiveCursors username={username} />

      {/* 3. Floating Tactical UI Controls Overlay */}
      <div className="pointer-events-none absolute inset-0 z-40">
        <div className="pointer-events-auto">
          {/* Top Navbar & Bottom Tool Dock */}
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
            onUndo={() => undoRef.current && undoRef.current()}
            onRedo={() => redoRef.current && redoRef.current()}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLeave={handleLeave}
            usersInRoom={usersInRoom}
          />

          {/* Minimalist Bottom-Left Zoom Widget */}
          <ZoomWidget
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
          />
        </div>
      </div>

      {/* 4. Studio Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Whiteboard;