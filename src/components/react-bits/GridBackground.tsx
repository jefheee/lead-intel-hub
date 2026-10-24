'use client';

import React from 'react';

interface GridBackgroundProps {
  className?: string;
}

export function GridBackground({ className = '' }: GridBackgroundProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Subtle radial glow in the center-top */}
      <div 
        suppressHydrationWarning
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), rgba(245, 158, 11, 0.08) 40%, transparent 70%)',
        }}
      />
      
      {/* SVG grid pattern with circular mask */}
      <svg
        className="absolute inset-0 h-full w-full stroke-white/[0.035] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="intel-grid-pattern"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path d="M.5 32V.5H32" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#intel-grid-pattern)" />
      </svg>
    </div>
  );
}
