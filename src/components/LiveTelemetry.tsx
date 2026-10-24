'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, Loader2, X, Clock } from 'lucide-react';
import { TelemetryLog } from '@/types';

interface LiveTelemetryProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TelemetryLog[];
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  hasError: boolean;
}

const STEPS_DESCRIPTION = [
  'Verificação e auto-início do Motor Docker (8080)',
  'Geocodificação e perímetro geográfico',
  'Varredura no Google Maps em tempo real',
  'Auditoria Técnica Zero-Token (SSL, Stack, Pixels, Linktree)',
  'Cálculo de Score e plotagem cartográfica',
];

export function LiveTelemetry({
  isOpen,
  onClose,
  logs,
  currentStep,
  totalSteps = 5,
  isComplete,
  hasError,
}: LiveTelemetryProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !isComplete && !hasError) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, isComplete, hasError]);

  if (!isOpen) return null;

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="bg-[#111215] border border-white/[0.1] rounded-xl p-3.5 shadow-xl text-xs space-y-2.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span className="font-mono text-[#f4f4f6] text-[11px] uppercase tracking-wider">
            Telemetria de Varredura
          </span>
          <span className="bg-[#1c1d22] text-[#f59e0b] border border-white/[0.07] font-mono text-[10px] px-1.5 py-0.5 rounded">
            {currentStep}/{totalSteps} • {progressPercentage}%
          </span>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-[10px] text-[#71717a]">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#71717a]" />
            <span>{elapsedSeconds}s</span>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className="text-[#71717a] hover:text-[#f4f4f6] p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-[#0a0b0d] h-1.5 rounded-full overflow-hidden border border-white/[0.05]">
        <div
          className={`h-full transition-all duration-500 ${
            hasError ? 'bg-rose-500' : isComplete ? 'bg-emerald-500' : 'bg-[#d97706]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stepper Compacto */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5 pt-0.5">
        {STEPS_DESCRIPTION.map((desc, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum || isComplete;
          const isCurrent = currentStep === stepNum && !isComplete && !hasError;

          return (
            <div
              key={idx}
              className={`p-1.5 rounded border text-[10px] font-mono flex items-start gap-1.5 transition ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-[#1c1d22] border-[#f59e0b]/50 text-[#fbbf24]'
                  : 'bg-[#0a0b0d] border-white/[0.04] text-[#52525b]'
              }`}
            >
              <span className="shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 text-[#f59e0b] animate-spin" />
                ) : (
                  <span className="w-3 h-3 rounded border border-white/[0.1] flex items-center justify-center text-[8px]">
                    {stepNum}
                  </span>
                )}
              </span>
              <span className="leading-tight line-clamp-1">{desc}</span>
            </div>
          );
        })}
      </div>

      {/* Terminal Output */}
      <div className="bg-[#08090b] rounded border border-white/[0.05] p-2 font-mono text-[10px] max-h-28 overflow-y-auto space-y-1 text-[#d4d4d8] select-text">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="text-[#52525b] shrink-0">{log.timestamp}</span>
            <span
              className={
                log.type === 'error'
                  ? 'text-rose-400'
                  : log.type === 'success'
                  ? 'text-emerald-400'
                  : log.type === 'warning'
                  ? 'text-amber-400'
                  : 'text-[#e4e4e7]'
              }
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
