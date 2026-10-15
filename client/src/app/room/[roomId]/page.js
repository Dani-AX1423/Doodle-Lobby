"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import Whiteboard from '../../../components/Whiteboard';
import AuthGate from '../../../components/AuthGate';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId ? decodeURIComponent(params.roomId) : '';
  const { rooms, username, setUsername } = useSocket();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121214] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate onAuthSuccess={handleAuthSuccess} />;
  }

  const currentRoom = rooms.find((r) => r.roomId === roomId);
  const roomName = currentRoom?.roomName || `Canvas: ${roomId}`;

  return <Whiteboard roomId={roomId} roomName={roomName} />;
}