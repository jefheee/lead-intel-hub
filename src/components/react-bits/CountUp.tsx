'use client';

import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: CountUpProps) {
  const [value, setValue] = useState<number>(from);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let startVal = value;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1);
      
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (to - startVal) * ease;
      
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(to);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [to, duration]);

  const formattedValue = decimals > 0 
    ? value.toFixed(decimals) 
    : Math.round(value).toString();

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
