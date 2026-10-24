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

  const getColorClass = (val: number) => {
    if (val >= 75) return 'text-[#f59e0b] stroke-[#f59e0b]';
    if (val >= 45) return 'text-[#fbbf24] stroke-[#d97706]';
    return 'text-[#71717a] stroke-[#52525b]';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[#202226]"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${getColorClass(normalizedScore)} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className={`absolute font-mono font-bold text-[10px] ${getColorClass(normalizedScore).split(' ')[0]}`}>
          {normalizedScore}
        </span>
      )}
    </div>
  );
}
