'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 3,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.85)',
}: ShinyTextProps) {
  if (disabled) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-no-repeat transition-all ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(255, 255, 255, 0.4) 0%, ${shimmerColor} 50%, rgba(255, 255, 255, 0.4) 100%)`,
        backgroundSize: '200% 100%',
        animation: `shiny-shimmer ${speed}s linear infinite`,
      }}
    >
      {text}
    </span>
  );
}
