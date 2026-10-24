'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

export function ScoreRing({
  score,
  size = 36,
  strokeWidth = 3,
  showText = true,
}: ScoreRingProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColorConfig = (val: number) => {
    if (val >= 75) {
      return {
        text: 'text-amber-400',
        stroke: 'stroke-amber-400',
        glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]',
      };
    }
    if (val >= 45) {
      return {
        text: 'text-amber-300',
        stroke: 'stroke-amber-500',
        glow: 'drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]',
      };
    }
    return {
      text: 'text-zinc-500',
      stroke: 'stroke-zinc-600',
      glow: '',
    };
  };

  const config = getColorConfig(normalizedScore);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-800/80"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${config.stroke} ${config.glow} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className={`absolute font-mono font-bold text-[10px] tracking-tighter ${config.text}`}>
          {normalizedScore}
        </span>
      )}
    </div>
  );
}
