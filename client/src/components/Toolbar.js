"use client";

import React, { useState } from 'react';
import { 
  Pencil, 
  Minus, 
  Square, 
  Circle, 
  Eraser, 
  Trash2, 
  Download, 
  Share2, 
  LogOut, 
  Users, 
  Check, 
  Palette,
  Sparkles
} from 'lucide-react';

const COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Amber', value: '#f59e0b' },
];

const TOOLS = [
  { id: 'pencil', label: 'Pencil', icon: Pencil },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'rectangle', label: 'Rect', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
];

const Toolbar = ({
  roomId,
  roomName = 'Whiteboard Studio',
  tool,
  setTool,
  lineWidth,
  setLineWidth,
  color,
  setColor,
  onClear,
  onExport,
  username,
  onLeave,
  usersInRoom = [],
}) => {
  const [copiedToast, setCopiedToast] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      try {
        navigator.clipboard.writeText(url);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch (err) {
        // Fallback prompt
        window.prompt('Copy room link:', url);
      }
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-3 left-4 right-4 z-40 flex items-center justify-between gap-4 backdrop-blur-xl bg-slate-950/70 border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
        {/* Left: Branding & Room Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-white tracking-tight">{roomName}</h2>
            <p className="text-[10px] text-slate-400 font-mono">ID: {roomId ? roomId.substring(0, 15) : 'active'}</p>
          </div>
        </div>

        {/* Center: Active Users Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden items-center">
            {usersInRoom.slice(0, 5).map((u, i) => (
              <div
                key={u.username + i}
                title={u.username}
                style={{ backgroundColor: u.color || '#6366f1' }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold text-white ring-2 ring-slate-950 shadow-md uppercase transition-transform hover:scale-110 hover:z-10"
              >
                {(u.username || 'A').charAt(0)}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{usersInRoom.length || 1} online</span>
          </div>
        </div>

        {/* Right: Actions (Copy Link, Export, Clear, Leave) */}
        <div className="flex items-center gap-2">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 transition-all hover:scale-105 active:scale-95"
            title="Share Lobby Link"
          >
            {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden md:inline">{copiedToast ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 transition-all hover:scale-105 active:scale-95"
            title="Export canvas as PNG image"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Export PNG</span>
          </button>

          {/* Clear Canvas */}
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all hover:scale-105 active:scale-95"
            title="Clear all drawings"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear</span>
          </button>

          {/* Leave Lobby Button */}
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-rose-600/20 hover:from-red-500 hover:to-rose-500 transition-all hover:scale-105 active:scale-95"
            title="Leave Lobby"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Lobby</span>
          </button>
        </div>
      </nav>

      {/* Toast Notification for Link Copied */}
      {copiedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl backdrop-blur-xl bg-slate-900/90 border border-indigo-500/40 text-indigo-300 text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Room invitation link copied to clipboard! ✨</span>
        </div>
      )}

      {/* Floating Bottom Glassmorphism Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 backdrop-blur-2xl bg-slate-950/80 border border-white/10 p-2.5 rounded-2xl shadow-2xl max-w-full overflow-x-auto">
        {/* Drawing Tools Group */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`relative p-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={t.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        {/* Minimalist Color Palette */}
        <div className="flex items-center gap-1.5 px-2">
          {COLORS.map((c) => {
            const isSelected = color === c.value && tool !== 'eraser';
            return (
              <button
                key={c.name}
                onClick={() => {
                  setColor(c.value);
                  if (tool === 'eraser') setTool('pencil');
                }}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${
                  isSelected ? 'ring-2 ring-indigo-400 scale-110 shadow-md' : 'opacity-85 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            );
          })}

          {/* Custom Color Input */}
          <label className="relative cursor-pointer w-6 h-6 rounded-full overflow-hidden border border-white/20 hover:scale-110 transition-transform">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (tool === 'eraser') setTool('pencil');
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Custom Color"
            />
            <div 
              className="w-full h-full" 
              style={{ background: 'conic-gradient(from 180deg at 50% 50%, #f43f5e, #f59e0b, #10b981, #06b6d4, #6366f1, #a855f7, #f43f5e)' }} 
            />
          </label>
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        {/* Stroke Width Slider */}
        <div className="flex items-center gap-2.5 px-2">
          <span className="text-[11px] font-mono text-slate-400">{lineWidth}px</span>
          <input
            type="range"
            min="1"
            max="32"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            className="w-20 sm:w-28 accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            title="Stroke Width"
          />
          <div
            className="rounded-full bg-slate-200 transition-all shrink-0"
            style={{ width: Math.max(3, lineWidth / 2), height: Math.max(3, lineWidth / 2) }}
          />
        </div>
      </div>
    </>
  );
};

export default Toolbar;