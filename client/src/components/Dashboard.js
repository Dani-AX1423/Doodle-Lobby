"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../hooks/useSocket';
import { 
  Palette, 
  PlusCircle, 
  Layers, 
  Users, 
  ArrowRight, 
  Sparkles, 
  LogOut, 
  Wifi, 
  WifiOff, 
  CheckCircle2,
  Brush
} from 'lucide-react';

const Dashboard = ({ onLogout }) => {
  const router = useRouter();
  const { connected, rooms, createRoom, username, setUsername } = useSocket();
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'create'
  const [newCanvasName, setNewCanvasName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const presets = [
    { title: '⚡ Sprint Brainstorm', desc: 'Quick ideation and flow mapping' },
    { title: '🎨 Freehand Studio', desc: 'Open sketchpad for creative doodles' },
    { title: '📐 UI Architecture', desc: 'Wireframing layouts and user journeys' },
    { title: '💡 Team Retro Board', desc: 'Post-launch reflections and doodles' },
  ];

  const handleJoin = (roomId) => {
    router.push(`/room/${roomId}`);
  };

  const handleCreate = (e) => {
    if (e) e.preventDefault();
    const finalName = newCanvasName.trim() || 'Untitled Canvas';
    setIsCreating(true);

    createRoom(finalName, username, (createdRoom) => {
      setIsCreating(false);
      setNewCanvasName('');
      if (createdRoom && createdRoom.roomId) {
        router.push(`/room/${createdRoom.roomId}`);
      }
    });

    // Fallback timer if callback isn't supported by server ack
    setTimeout(() => {
      setIsCreating(false);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 overflow-x-hidden">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 bg-grid-white/[0.03] pointer-events-none" />

      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Top Navbar */}
        <header className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 mb-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center p-[1px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950/90 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  DoodleLobby
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Live
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Collaborative Whiteboard Mesh</p>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

            {/* Real-time Connection Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs">
              {connected ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-medium">Server Online</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 animate-pulse"></span>
                  </span>
                  <span className="text-rose-400 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {(username || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-200">
                {username || 'Anonymous'}
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                title="Switch Artist / Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Tab Switcher & Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'available'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Available Canvases</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'available' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
              }`}>
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Canvas</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Click any canvas card to enter immediate co-drawing session</span>
          </div>
        </div>

        {/* Tab Content 1: Available Canvases */}
        {activeTab === 'available' && (
          <div>
            {rooms.length === 0 ? (
              /* Clean Empty State */
              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <Brush className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No active canvases found</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                  There are no collaborative lobbies open right now. Launch a new canvas and invite your teammates to draw!
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Your First Canvas</span>
                </button>
              </div>
            ) : (
              /* Available Canvases Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rooms.map((room) => (
                  <div
                    key={room.roomId}
                    onClick={() => handleJoin(room.roomId)}
                    className="group relative cursor-pointer backdrop-blur-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between"
                  >
                    {/* Top row */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {room.roomName}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {room.activeUserCount} Active
                        </span>
                      </div>

                      {/* Creator badge */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                        <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {(room.creatorUsername || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span>Created by <strong className="text-slate-200 font-medium">{room.creatorUsername}</strong></span>
                      </div>
                    </div>

                    {/* Gradient Join Lobby Button */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">ID: {room.roomId.substring(0, 12)}</span>
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 group-hover:from-indigo-600 group-hover:to-pink-600 shadow-md shadow-indigo-500/20 transition-all">
                        <span>Join Lobby</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Create Canvas */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Create a New Whiteboard Lobby</h3>
                <p className="text-xs text-slate-400">Give your canvas a name or pick one of our instant workspace presets</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                  Canvas Name
                </label>
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="e.g. Next-Gen Product Wireframe"
                  maxLength={40}
                  className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Quick Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presets.map((preset) => (
                    <button
                      type="button"
                      key={preset.title}
                      onClick={() => setNewCanvasName(preset.title)}
                      className="text-left p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-indigo-500/30 transition-all text-xs"
                    >
                      <span className="font-semibold text-slate-200 block mb-0.5">{preset.title}</span>
                      <span className="text-slate-400">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-50"
              >
                <div className="relative flex items-center justify-center gap-2 rounded-xl bg-transparent py-3.5 px-4 font-semibold text-white">
                  <span>{isCreating ? 'Spawning Canvas...' : 'Launch Whiteboard Lobby 🚀'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;