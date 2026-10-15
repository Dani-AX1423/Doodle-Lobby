"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import ioClient from 'socket.io-client';

const io = typeof ioClient === 'function' ? ioClient : (ioClient.io || ioClient.default || ioClient);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Default safe fallback dummy functions so named imports never throw ReferenceError
export const joinRoom = () => {};
export const leaveRoom = () => {};
export const createRoom = () => {};
export const sendDrawEvent = () => {};
export const sendCursorMove = () => {};
export const clearCanvas = () => {};
export const sendClearCanvas = () => {};
export const connected = false;

// Default context value to prevent "TypeError: Cannot destructure property of undefined"
const defaultSocketContext = {
  connected: false,
  rooms: [],
  usersInRoom: [],
  cursorPositions: [],
  drawingHistory: [],
  username: '',
  currentRoomId: '',
  setUsername: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  createRoom: () => {},
  sendDrawEvent: () => {},
  sendCursorMove: () => {},
  clearCanvas: () => {},
  sendClearCanvas: () => {},
  verifyPassword: () => false,
  subscribeDrawEvent: () => () => {},
  subscribeClearCanvas: () => () => {},
};

export const SocketContext = createContext(defaultSocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [cursorPositions, setCursorPositions] = useState([]);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [username, setUsername] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState('');

  const socketRef = useRef(null);
  const drawSubscribersRef = useRef(new Set());
  const clearSubscribersRef = useRef(new Set());

  // Initialize username from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('doodlelobby-creds');
        if (saved) {
          const [savedUser] = saved.split('|');
          if (savedUser) setUsername(savedUser);
        }
      } catch (e) {
        // Ignore localStorage error
      }
    }
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected to server:', socket.id);
      setIsConnected(true);
      socket.emit('get-rooms', {});
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected from server');
      setIsConnected(false);
    });

    // Room list event
    socket.on('get-rooms', (data) => {
      if (!data) return;
      if (Array.isArray(data)) {
        setRooms(data);
      } else if (typeof data === 'string') {
        const roomsList = data.split(';').filter(s => s && s.trim().length > 0);
        const parsed = roomsList.map(roomStr => {
          const [rid, rname, userCount, creator] = roomStr.split('|');
          return {
            roomId: rid || '',
            roomName: rname || 'Untitled Room',
            activeUserCount: parseInt(userCount, 10) || 0,
            creatorUsername: creator || 'Unknown',
          };
        });
        setRooms(parsed);
      }
    });

    // Drawing event broadcast
    socket.on('draw-event', (data) => {
      let stroke = data;
      if (typeof data === 'string') {
        try {
          stroke = JSON.parse(data);
        } catch (e) {
          stroke = data;
        }
      }
      setDrawingHistory(prev => [...prev, stroke]);
      drawSubscribersRef.current.forEach(callback => {
        try {
          callback(stroke);
        } catch (err) {
          console.error('Error in draw subscriber callback:', err);
        }
      });
    });

    // Cursor move broadcast
    socket.on('cursor-move', (data) => {
      let cursor = data;
      if (typeof data === 'string') {
        try {
          cursor = JSON.parse(data);
        } catch (e) {
          cursor = data;
        }
      }
      if (!cursor || !cursor.username) return;

      setCursorPositions(prev => {
        const filtered = prev.filter(c => c.username !== cursor.username);
        return [...filtered, cursor];
      });
    });

    // User joined room
    socket.on('user-joined', (data) => {
      let uname = '';
      let color = '#6366f1';

      if (typeof data === 'string') {
        const parts = data.split('|');
        uname = parts[0] || 'Artist';
        color = parts[1] || '#6366f1';
      } else if (data && typeof data === 'object') {
        uname = data.username || 'Artist';
        color = data.color || '#6366f1';
      }

      if (uname) {
        setUsersInRoom(prev => {
          if (prev.some(u => u.username === uname)) return prev;
          return [...prev, { username: uname, color }];
        });
      }
    });

    // User left room
    socket.on('user-left', (data) => {
      const leftUsername = typeof data === 'string' ? data : (data?.username || '');
      if (leftUsername) {
        setUsersInRoom(prev => prev.filter(u => u.username !== leftUsername));
        setCursorPositions(prev => prev.filter(c => c.username !== leftUsername));
      }
    });

    // Clear canvas
    socket.on('clear-canvas', () => {
      setDrawingHistory([]);
      clearSubscribersRef.current.forEach(callback => {
        try {
          callback();
        } catch (err) {
          console.error('Error in clear subscriber callback:', err);
        }
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinRoom = useCallback((roomId, userName) => {
    if (!roomId) return;
    const finalUser = userName || username || 'Artist';
    setCurrentRoomId(roomId);
    setUsersInRoom([{ username: finalUser, color: '#6366f1' }]);
    setDrawingHistory([]);
    setCursorPositions([]);

    if (socketRef.current) {
      socketRef.current.emit('join-room', { roomId, username: finalUser });
    }
  }, [username]);

  const leaveRoom = useCallback((roomId) => {
    const targetRoom = roomId || currentRoomId;
    if (socketRef.current && targetRoom) {
      socketRef.current.emit('leave-room', { roomId: targetRoom });
    }
    setCurrentRoomId('');
    setUsersInRoom([]);
    setDrawingHistory([]);
    setCursorPositions([]);
  }, [currentRoomId]);

  const createRoom = useCallback((roomName, userName, onCreated) => {
    const finalUser = userName || username || 'Creator';
    if (!socketRef.current) return;

    if (onCreated) {
      const handler = (data) => {
        socketRef.current.off('room-created', handler);
        onCreated(data);
      };
      socketRef.current.on('room-created', handler);
    }

    socketRef.current.emit('create-room', {
      roomName: roomName || 'New Canvas',
      username: finalUser,
    });
  }, [username]);

  const sendDrawEvent = useCallback((drawData) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw-event', drawData);
    }
  }, []);

  const sendCursorMove = useCallback((cursorData) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('cursor-move', cursorData);
    }
  }, []);

  const clearCanvas = useCallback((roomId) => {
    const target = roomId || currentRoomId;
    setDrawingHistory([]);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('clear-canvas', { roomId: target });
    }
  }, [currentRoomId]);

  const sendClearCanvas = clearCanvas;

  const verifyPassword = useCallback((password) => {
    return password === 'doodlelobby-secret';
  }, []);

  const subscribeDrawEvent = useCallback((callback) => {
    drawSubscribersRef.current.add(callback);
    return () => {
      drawSubscribersRef.current.delete(callback);
    };
  }, []);

  const subscribeClearCanvas = useCallback((callback) => {
    clearSubscribersRef.current.add(callback);
    return () => {
      clearSubscribersRef.current.delete(callback);
    };
  }, []);

  const contextValue = {
    connected: isConnected,
    rooms,
    usersInRoom,
    cursorPositions,
    drawingHistory,
    username,
    currentRoomId,
    setUsername,
    joinRoom,
    leaveRoom,
    createRoom,
    sendDrawEvent,
    sendCursorMove,
    clearCanvas,
    sendClearCanvas,
    verifyPassword,
    subscribeDrawEvent,
    subscribeClearCanvas,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return defaultSocketContext;
  }
  return context;
};

export default useSocket;