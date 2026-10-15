"use client";

import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  KeyRound, 
  User, 
  ArrowRight, 
  Moon, 
  Sun, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

const AuthGate = ({ onAuthSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('doodlelobby-creds');
        if (saved) {
          const [savedUser, savedPass] = saved.split('|');
          if (savedUser) setUsername(savedUser);
          if (savedPass) setPassword(savedPass);
        }
      } catch (e) {}
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
      setError('Invalid passcode. Default passcode: doodlelobby-secret');
      return;
    }

    setIsLoading(true);

    try {
      localStorage.setItem('doodlelobby-creds', `${trimmedUser}|${password}`);
    } catch (e) {}

    setTimeout(() => {
      setIsLoading(false);
      if (onAuthSuccess) {
        onAuthSuccess(trimmedUser, password);
      }
    }, 150);
  };

  const handleQuickFill = () => {
    setPassword('doodlelobby-secret');
    if (!username) {
      setUsername('Artist' + Math.floor(100 + Math.random() * 900));
    }
    setError('');
  };

  const gridClass = isDark ? 'canvas-grid-dark' : 'canvas-grid-light';

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-4 transition-colors select-none ${gridClass}`}>
      {/* Top Corner Theme Switcher */}
      <div className="absolute top-5 right-5">
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border transition-all ${
            isDark 
              ? 'bg-[#18181b] border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {/* Main Tactical Card */}
      <div 
        className={`relative z-10 w-full max-w-sm p-7 rounded-2xl border shadow-2xl transition-all ${
          isDark 
            ? 'bg-[#18181b] border-zinc-800 text-zinc-100' 
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Branding */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold tracking-tight">DoodleLobby</h1>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
            }`}>
              Tactical
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Real-time multiplayer collaborative canvas
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-[11px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Artist Handle
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
                placeholder="e.g. Leonardo, Alex"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[11px] font-mono uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Passcode
              </label>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-mono text-indigo-500 hover:underline"
              >
                Quick fill
              </button>
            </div>
            <div className="relative">
              <KeyRound className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room passcode..."
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Verifying...' : 'Enter Studio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className={`mt-5 pt-4 border-t flex items-center justify-center gap-1.5 text-[11px] font-mono ${
          isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-time Socket.IO Sync</span>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;