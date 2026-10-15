"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';
import SettingsModal from './SettingsModal';
import { 
  Palette, 
  PlusCircle, 
  Layers, 
  ArrowRight, 
  LogOut, 
  Sliders, 
  Brush,
  Radio,
  Sparkles
} from 'lucide-react';

const Dashboard = ({ onLogout }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { connected, rooms, createRoom, username } = useSocket();
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'create'
  const [newCanvasName, setNewCanvasName] = useState('');
  const [canvasType, setCanvasType] = useState('infinite'); // 'infinite' | 'fixed-16-9' | 'fixed-a4'
  const [isCreating, setIsCreating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const presets = [
    { title: '⚡ Sprint Retrospective', desc: 'Flow mapping & team retro board' },
    { title: '📐 UI Architecture', desc: 'Wireframing layouts & system schemas' },
    { title: '💡 Rapid Ideation', desc: 'Freehand sketching & brainstorm mesh' },
    { title: '🎨 Freehand Studio', desc: 'Open tactile canvas for raw sketching' },
  ];

  const handleJoin = (roomId) => {
    router.push(`/room/${roomId}`);
  };

  const handleCreate = (e) => {
    if (e) e.preventDefault();
    const finalName = newCanvasName.trim() || 'Tactical Canvas';
    setIsCreating(true);

    createRoom(finalName, username, canvasType, (createdRoom) => {
      setIsCreating(false);
      setNewCanvasName('');
      if (createdRoom && createdRoom.roomId) {
        router.push(`/room/${createdRoom.roomId}`);
      }
    });

    setTimeout(() => {
      setIsCreating(false);
    }, 1500);
  };

  const gridClass = isDark ? 'canvas-grid-dark' : 'canvas-grid-light';

  return (
    <div className={`relative min-h-screen p-4 sm:p-8 transition-colors select-none ${gridClass}`}>
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Top Tactical Navbar */}
        <header 
          className={`px-5 py-3.5 mb-8 rounded-2xl border shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
            isDark 
              ? 'bg-[#18181b]/90 border-zinc-800 text-zinc-100' 
              : 'bg-white/95 border-zinc-200 text-zinc-900'
          }`}
        >
          {/* Logo & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>DoodleLobby</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                }`}>
                  Live Studio
                </span>
              </span>
            </div>

            <div className={`h-4 w-[1px] hidden sm:block ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            {/* Real-time Connection Indicator */}
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              {connected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500 font-medium">Server Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-rose-500 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-medium ${
              isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
            }`}>
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {(username || 'A').charAt(0)}
              </div>
              <span>{username || 'Artist'}</span>
            </div>

            {/* Studio Settings Gear */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-xl border transition-all ${
                isDark 
                  ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' 
                  : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
              }`}
              title="Studio Settings & Theme Toggle"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className={`p-2 rounded-xl border transition-all ${
                  isDark 
                    ? 'border-zinc-800 hover:border-rose-800 hover:text-rose-400 text-zinc-400' 
                    : 'border-zinc-200 hover:border-rose-300 hover:text-rose-600 text-zinc-600'
                }`}
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className={`inline-flex p-1 rounded-xl border ${
            isDark ? 'bg-[#18181b]/80 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'available'
                  ? isDark
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Available Canvases</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeTab === 'available'
                  ? isDark ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-white'
                  : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {rooms.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? isDark
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Canvas</span>
            </button>
          </div>

          <div className={`text-xs font-mono hidden md:flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <span>2-min idle auto-destruction active</span>
          </div>
        </div>

        {/* Tab 1: Available Canvases */}
        {activeTab === 'available' && (
          <div>
            {rooms.length === 0 ? (
              <div 
                className={`p-12 text-center rounded-2xl border shadow-lg max-w-md mx-auto my-6 ${
                  isDark 
                    ? 'bg-[#18181b]/80 border-zinc-800 text-zinc-200' 
                    : 'bg-white border-zinc-200 text-zinc-800'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto mb-3 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                }`}>
                  <Brush className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base mb-1">No active lobbies</h3>
                <p className={`text-xs mb-5 max-w-xs mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Launch a tactical canvas and share the link with your team to start real-time sketching.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                >
                  Create New Canvas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.roomId}
                    onClick={() => handleJoin(room.roomId)}
                    className={`group cursor-pointer p-5 rounded-2xl border shadow-sm transition-all flex flex-col justify-between ${
                      isDark 
                        ? 'bg-[#18181b] hover:bg-[#202024] border-zinc-800 hover:border-zinc-700 text-zinc-100' 
                        : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-indigo-500 transition-colors">
                          {room.roomName}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-zinc-50 border-zinc-200 text-emerald-600'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {room.activeUserCount} Active
                        </span>
                      </div>

                      <div className={`flex items-center justify-between gap-2 text-xs font-mono mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        <span>By {room.creatorUsername}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                        }`}>
                          {room.canvasType === 'fixed-16-9' ? '16:9 Sheet' : room.canvasType === 'fixed-a4' ? 'A4 Sheet' : 'Infinite'}
                        </span>
                      </div>
                    </div>

                    <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                      isDark ? 'border-zinc-800' : 'border-zinc-100'
                    }`}>
                      <span className={`font-mono text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {room.roomId.substring(0, 14)}
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-indigo-500 group-hover:translate-x-0.5 transition-transform">
                        <span>Join</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Canvas */}
        {activeTab === 'create' && (
          <div 
            className={`max-w-xl mx-auto p-6 sm:p-8 rounded-2xl border shadow-xl transition-all ${
              isDark 
                ? 'bg-[#18181b] border-zinc-800 text-zinc-100' 
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">New Whiteboard Studio</h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Select a template or type your canvas title
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Canvas Name
                </label>
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="e.g. Sprint Architecture Whiteboard"
                  maxLength={40}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
              </div>

              {/* Canvas Type Selection */}
              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Canvas Type & Layout
                </label>
                <div className="relative">
                  <select
                    value={canvasType}
                    onChange={(e) => setCanvasType(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <option value="infinite">Infinite Space (Unbounded canvas)</option>
                    <option value="fixed-16-9">Fixed Sheet (16:9 Widescreen — 1920×1080)</option>
                    <option value="fixed-a4">Fixed Sheet (A4 Portrait — 1240×1754)</option>
                  </select>
                </div>
              </div>

              {/* Presets */}
              <div>
                <span className={`block text-xs font-mono uppercase tracking-wider mb-2.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Workspace Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presets.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => setNewCanvasName(p.title)}
                      className={`text-left p-3 rounded-xl border transition-all text-xs ${
                        isDark 
                          ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                      }`}
                    >
                      <span className="font-semibold block mb-0.5">{p.title}</span>
                      <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isCreating ? 'Creating Room...' : 'Launch Canvas'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Dashboard;