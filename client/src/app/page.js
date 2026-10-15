"use client";

import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import AuthGate from '../components/AuthGate';
import Dashboard from '../components/Dashboard';

export default function Page() {
  const { setUsername } = useSocket();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('doodlelobby-creds');
      if (saved) {
        const [savedUser, savedPass] = saved.split('|');
        if (savedUser && savedPass === 'doodlelobby-secret') {
          setUsername(savedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      // Ignore localStorage error
    } finally {
      setIsCheckingAuth(false);
    }
  }, [setUsername]);

  const handleAuthSuccess = (user) => {
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('doodlelobby-creds');
    } catch (e) {}
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate onAuthSuccess={handleAuthSuccess} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}