"use client";

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../hooks/useSocket';
import { 
  X, 
  Moon, 
  Sun, 
  Grid, 
  User, 
  Check, 
  Command, 
  Sliders, 
  Sparkles,
  Keyboard
} from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, setTheme, showGrid, toggleGrid } = useTheme();
  const { username, setUsername } = useSocket();
  const [newUsername, setNewUsername] = useState(username || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const trimmed = newUsername.trim();
    if (trimmed && trimmed.length >= 3 && trimmed.length <= 15) {
      setUsername(trimmed);
      try {
        const saved = localStorage.getItem('doodlelobby-creds');
        const pass = saved ? saved.split('|')[1] || 'doodlelobby-secret' : 'doodlelobby-secret';
        localStorage.setItem('doodlelobby-creds', `${trimmed}|${pass}`);
      } catch (err) {}
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all duration-200 ${
          isDark 
            ? 'bg-[#18181b] border-zinc-800 text-zinc-100' 
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isDark ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'}`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-none">Studio Settings</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Customize canvas display & profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark 
                ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' 
                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Section 1: Theme Switcher */}
          <div>
            <label className={`block text-xs font-mono uppercase tracking-wider mb-2.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Interface & Canvas Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isDark
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-[#121214]'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold">Dark Tactical</span>
                  </div>
                  {isDark && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="h-7 w-full rounded-md bg-[#121214] border border-zinc-800 canvas-grid-dark flex items-center justify-center">
                  <span className="text-[10px] text-zinc-400 font-mono">#121214</span>
                </div>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !isDark
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-white'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold">Light Tactical</span>
                  </div>
                  {!isDark && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="h-7 w-full rounded-md bg-[#F8F9FA] border border-zinc-300 canvas-grid-light flex items-center justify-center">
                  <span className="text-[10px] text-zinc-600 font-mono">#F8F9FA</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Canvas Grid Visibility */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <Grid className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
              <div>
                <span className="text-xs font-medium block">Canvas Alignment Grid</span>
                <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {isDark ? 'Fine tactical lines' : 'Dot-matrix pattern'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleGrid}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showGrid ? 'bg-indigo-600' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showGrid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Section 3: Profile Customization */}
          <div className="pt-2 border-t border-inherit">
            <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Artist Display Handle
            </label>
            <form onSubmit={handleSaveProfile} className="flex gap-2">
              <div className="relative flex-1">
                <User className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  maxLength={15}
                  placeholder="3-15 chars"
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center gap-1 shrink-0"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedSuccess ? 'Saved' : 'Update'}</span>
              </button>
            </form>
          </div>

          {/* Section 4: Keyboard Shortcuts Cheat Sheet */}
          <div className={`p-3 rounded-xl border text-[11px] ${isDark ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200/80 text-zinc-600'}`}>
            <div className="flex items-center gap-1.5 font-semibold text-xs mb-2">
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Canvas Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[10px]">
              <div><kbd className="px-1 py-0.5 rounded border border-inherit bg-zinc-800/30">Space + Drag</kbd> Pan</div>
              <div><kbd className="px-1 py-0.5 rounded border border-inherit bg-zinc-800/30">Scroll</kbd> Zoom</div>
              <div><kbd className="px-1 py-0.5 rounded border border-inherit bg-zinc-800/30">Ctrl + Z</kbd> Undo</div>
              <div><kbd className="px-1 py-0.5 rounded border border-inherit bg-zinc-800/30">Ctrl + Y</kbd> Redo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
