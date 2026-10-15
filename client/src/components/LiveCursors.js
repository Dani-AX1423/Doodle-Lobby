"use client";

import React from 'react';
import { useSocket } from '../hooks/useSocket';

const LiveCursors = ({ username: myUsername }) => {
  const { cursorPositions } = useSocket();

  if (!cursorPositions || cursorPositions.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {cursorPositions.map((cursor) => {
        if (!cursor || !cursor.username || cursor.username === myUsername) {
          return null;
        }

        const strokeColor = cursor.userColor || '#a855f7';

        return (
          <div
            key={cursor.username}
            className="absolute transition-all duration-75 ease-out flex items-start gap-1 select-none"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* SVG Pointer Arrow */}
            <svg
              className="w-5 h-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={strokeColor}
              stroke="#0f172a"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21a.75.75 0 0 0-1.12.82l3.47 13.9a.75.75 0 0 0 1.34.19l3.58-4.78 5.6 3.73a.75.75 0 0 0 1.05-.22l1.66-2.5a.75.75 0 0 0-.22-1.04l-5.6-3.74 4.78-3.58a.75.75 0 0 0-.2-1.34L5.5 3.21Z" />
            </svg>

            {/* Username Badge */}
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-lg backdrop-blur-md"
              style={{ backgroundColor: strokeColor }}
            >
              {cursor.username}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LiveCursors;