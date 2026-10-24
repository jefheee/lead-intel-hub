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
  size = 40,
  strokeWidth = 3.5,
  showText = true,
}: ScoreRingProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColorClass = (val: number) => {
    if (val >= 75) return 'text-emerald-400 stroke-emerald-500';
    if (val >= 45) return 'text-amber-400 stroke-amber-500';
    return 'text-slate-400 stroke-slate-500';
  };

  const getBgColorClass = (val: number) => {
    if (val >= 75) return 'stroke-emerald-950/40';
    if (val >= 45) return 'stroke-amber-950/40';
    return 'stroke-slate-800';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Trilho de fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={getBgColorClass(normalizedScore)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Barra de progresso do anel */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${getColorClass(normalizedScore)} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className={`absolute font-mono font-bold text-[11px] ${getColorClass(normalizedScore).split(' ')[0]}`}>
          {normalizedScore}
        </span>
      )}
    </div>
  );
}
