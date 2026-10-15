"use client";

import { useState, useEffect } from 'react';
import { Paintbrush, KeyRound, User, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

const AuthGate = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('doodlelobby-creds');
        if (saved) {
          const [savedUser, savedPass] = saved.split('|');
          if (savedUser) setUsername(savedUser);
          if (savedPass) setPassword(savedPass);
        }
      } catch (e) {
        // Ignore localStorage error
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (!trimmedUser || trimmedUser.length < 3 || trimmedUser.length > 15) {
      setError('Username must be between 3 and 15 characters.');
      return;
    }

    if (!password) {
      setError('Passcode is required to enter the lobby.');
      return;
    }

    if (password !== 'doodlelobby-secret') {
      setError('Invalid passcode. Default passcode is: doodlelobby-secret');
      return;
    }

    setIsLoading(true);

    try {
      localStorage.setItem('doodlelobby-creds', `${trimmedUser}|${password}`);
    } catch (e) {
      // Ignore localStorage error
    }

    setTimeout(() => {
      setIsLoading(false);
      if (onAuthSuccess) {
        onAuthSuccess(trimmedUser, password);
      }
    }, 200);
  };

  const handleQuickFill = () => {
    setPassword('doodlelobby-secret');
    if (!username) {
      setUsername('Artist' + Math.floor(100 + Math.random() * 900));
    }
    setError('');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />

      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] mb-4 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Paintbrush className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            DoodleLobby 🎨
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Real-time collaborative canvas for teams and creators
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
              Artist Handle
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
                placeholder="e.g. Leonardo, Alex"
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all"
              />
            </div>
          </div>

          {/* Passcode Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Lobby Secret Passcode
              </label>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Quick fill
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="relative flex items-center justify-center gap-2 rounded-xl bg-transparent py-3 px-4 font-semibold text-white transition-colors">
              <span>{isLoading ? 'Entering Studio...' : 'Enter DoodleLobby'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted real-time synchronization active</span>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;