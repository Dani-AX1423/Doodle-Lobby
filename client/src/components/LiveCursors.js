"use client";

import React from 'react';
import { useSocket } from '../hooks/useSocket';

const LiveCursors = ({ username: myUsername, scale = 1, pan = { x: 0, y: 0 } }) => {
  const { cursorPositions } = useSocket();

  if (!cursorPositions || cursorPositions.length === 0) {
    return null;
  }

  const panX = pan?.x || 0;
  const panY = pan?.y || 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {cursorPositions.map((cursor) => {
        if (!cursor || !cursor.username || cursor.username === myUsername) {
          return null;
        }

        const cursorColor = cursor.color || cursor.userColor || '#6366f1';
        const posX = typeof cursor.x === 'number' ? cursor.x : 0;
        const posY = typeof cursor.y === 'number' ? cursor.y : 0;

        // Transform incoming remote coordinates using canvas scale and pan offsets
        const renderX = posX * scale + panX;
        const renderY = posY * scale + panY;

        return (
          <div
            key={cursor.username}
            className="absolute transition-all duration-75 ease-out flex items-center select-none"
            style={{
              left: `${renderX}px`,
              top: `${renderY}px`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* SVG arrow cursor tinted with assigned color */}
            <svg
              className="w-5 h-5 drop-shadow-md shrink-0"
              viewBox="0 0 24 24"
              fill={cursorColor}
              stroke="#0f172a"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21a.75.75 0 0 0-1.12.82l3.47 13.9a.75.75 0 0 0 1.34.19l3.58-4.78 5.6 3.73a.75.75 0 0 0 1.05-.22l1.66-2.5a.75.75 0 0 0-.22-1.04l-5.6-3.74 4.78-3.58a.75.75 0 0 0-.2-1.34L5.5 3.21Z" />
            </svg>

            {/* Floating username badge */}
            <span
              className="ml-2 px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md whitespace-nowrap"
              style={{ backgroundColor: cursorColor }}
            >
              {cursor.username}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default LiveCursors;