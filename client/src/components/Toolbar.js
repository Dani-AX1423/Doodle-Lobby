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
  Check, 
  Sliders, 
  Undo2, 
  Redo2,
  Sparkles,
  Grid
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TACTICAL_COLORS = [
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Zinc Slate', value: '#a1a1aa' },
  { name: 'Tactical Indigo', value: '#6366f1' },
  { name: 'Signal Purple', value: '#a855f7' },
  { name: 'Rose Red', value: '#f43f5e' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Cyan Blue', value: '#06b6d4' },
  { name: 'Amber Yellow', value: '#f59e0b' },
];

const TOOLS = [
  { id: 'pencil', label: 'Pencil (P)', icon: Pencil },
  { id: 'line', label: 'Line (L)', icon: Minus },
  { id: 'rectangle', label: 'Rectangle (R)', icon: Square },
  { id: 'circle', label: 'Circle (C)', icon: Circle },
  { id: 'eraser', label: 'Eraser (E)', icon: Eraser },
];

const Toolbar = ({
  roomId,
  roomName = 'Tactical Canvas',
  tool,
  setTool,
  lineWidth,
  setLineWidth,
  color,
  setColor,
  onClear,
  onExport,
  onUndo,
  onRedo,
  onOpenSettings,
  onLeave,
  usersInRoom = [],
}) => {
  const { theme, showGrid, toggleGrid } = useTheme();
  const isDark = theme === 'dark';
  const [copiedToast, setCopiedToast] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      try {
        navigator.clipboard.writeText(url);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      } catch (err) {
        window.prompt('Room Link:', url);
      }
    }
  };

  return (
    <>
      {/* Top Tactical Navigation Bar */}
      <nav 
        className={`fixed top-3 left-4 right-4 z-40 flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl border shadow-xl backdrop-blur-xl transition-colors select-none ${
          isDark 
            ? 'bg-[#18181b]/90 border-zinc-800 text-zinc-100' 
            : 'bg-white/95 border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Left: Branding & Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <span>DoodleLobby</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
              }`}>
                v1.1
              </span>
            </span>
          </div>

          <div className={`h-4 w-[1px] hidden sm:block ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs font-medium max-w-[160px] truncate">{roomName}</span>
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
            }`}>
              {roomId ? roomId.substring(0, 14) : 'live'}
            </span>
          </div>
        </div>

        {/* Center: Online Artists Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 overflow-hidden items-center">
            {usersInRoom.slice(0, 6).map((u, i) => (
              <div
                key={u.username + i}
                title={u.username}
                style={{ backgroundColor: u.color || '#6366f1' }}
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ring-2 shadow-sm uppercase ${
                  isDark ? 'ring-[#18181b]' : 'ring-white'
                }`}
              >
                {(u.username || 'A').charAt(0)}
              </div>
            ))}
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono ${
            isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{usersInRoom.length || 1} live</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Grid Background Toggle */}
          <button
            type="button"
            onClick={toggleGrid}
            className={`p-2 rounded-xl border transition-all ${
              showGrid
                ? isDark ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-indigo-500/50 bg-indigo-50 text-indigo-600'
                : isDark ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500'
            }`}
            title={showGrid ? "Hide Grid (Clean Background)" : "Show Grid Background"}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition-all ${
              isDark 
                ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' 
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
            }`}
            title="Studio Settings & Theme"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isDark 
                ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-200' 
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-800'
            }`}
            title="Share Lobby Link"
          >
            {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedToast ? 'Copied' : 'Share'}</span>
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={onExport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isDark 
                ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-200' 
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-800'
            }`}
            title="Export Clean PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Clear Canvas */}
          <button
            type="button"
            onClick={onClear}
            className={`p-2 rounded-xl border transition-all ${
              isDark 
                ? 'border-rose-900/40 hover:bg-rose-950/40 text-rose-400' 
                : 'border-rose-200 hover:bg-rose-50 text-rose-600'
            }`}
            title="Clear Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-all shadow-sm"
            title="Exit Room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </nav>

      {/* Floating Bottom Minimalist Tooldock */}
      <div 
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all select-none max-w-full overflow-x-auto ${
          isDark 
            ? 'bg-[#18181b]/95 border-zinc-800 text-zinc-100' 
            : 'bg-white/95 border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Undo / Redo Group */}
        <div className={`flex items-center gap-0.5 p-1 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <button
            type="button"
            onClick={onUndo}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'}`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'}`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className={`h-6 w-[1px] ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Drawing Tools Group */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                className={`p-2 rounded-lg transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900 text-white font-semibold shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
                title={t.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className={`h-6 w-[1px] ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Color Palette */}
        <div className="flex items-center gap-1 px-1">
          {TACTICAL_COLORS.map((c) => {
            const isSelected = color === c.value && tool !== 'eraser';
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setColor(c.value);
                  if (tool === 'eraser') setTool('pencil');
                }}
                className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 ${
                  isDark ? 'border-zinc-700' : 'border-zinc-300'
                } ${isSelected ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-90 hover:opacity-100'}`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            );
          })}

          {/* Custom Color Input */}
          <label className={`relative cursor-pointer w-5 h-5 rounded-full overflow-hidden border transition-transform hover:scale-125 ${
            isDark ? 'border-zinc-700' : 'border-zinc-300'
          }`}>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (tool === 'eraser') setTool('pencil');
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Custom Hex Color"
            />
            <div 
              className="w-full h-full" 
              style={{ background: 'conic-gradient(from 180deg at 50% 50%, #f43f5e, #f59e0b, #10b981, #06b6d4, #6366f1, #a855f7, #f43f5e)' }} 
            />
          </label>
        </div>

        <div className={`h-6 w-[1px] ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Stroke Width Slider */}
        <div className="flex items-center gap-2 px-1">
          <input
            type="range"
            min="1"
            max="32"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
            className="w-16 sm:w-20 accent-indigo-500 cursor-pointer h-1.5 rounded-lg"
            title="Stroke Width"
          />
          <span className="text-[11px] font-mono w-6 text-right font-medium">
            {lineWidth}p
          </span>
        </div>
      </div>
    </>
  );
};

export default Toolbar;