"use client";

import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ZoomWidget = ({ zoom = 1, onZoomIn, onZoomOut, onZoomReset }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div 
      className={`fixed bottom-5 left-5 z-30 flex items-center gap-1.5 p-1 rounded-xl border shadow-lg backdrop-blur-md transition-all select-none ${
        isDark 
          ? 'bg-[#18181b]/90 border-zinc-800 text-zinc-200' 
          : 'bg-white/95 border-zinc-200 text-zinc-800'
      }`}
    >
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={onZoomOut}
        className={`p-1.5 rounded-lg border transition-colors ${
          isDark 
            ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' 
            : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
        }`}
        title="Zoom Out (Scroll Down)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Percentage Display */}
      <span className="px-2 text-xs font-mono font-medium min-w-[52px] text-center">
        {zoomPercent}%
      </span>

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={onZoomIn}
        className={`p-1.5 rounded-lg border transition-colors ${
          isDark 
            ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' 
            : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
        }`}
        title="Zoom In (Scroll Up)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Reset to 100% Button */}
      <button
        type="button"
        onClick={onZoomReset}
        className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1 ${
          isDark 
            ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' 
            : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
        }`}
        title="Reset Zoom to 100%"
      >
        <RotateCcw className="w-3 h-3" />
        <span>100%</span>
      </button>
    </div>
  );
};

export default ZoomWidget;
