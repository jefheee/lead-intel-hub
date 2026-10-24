'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, Loader2, X, Clock, AlertCircle } from 'lucide-react';
import { TelemetryLog } from '@/types';
import { ShinyText } from '@/components/react-bits/ShinyText';

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
  'Motor Docker (8080)',
  'Geocodificação Alvo',
  'Varredura Google Maps',
  'Auditoria Zero-Token',
  'Cálculo de Scores & CRM',
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
    <div className="bg-[#0c0e14]/95 backdrop-blur-md border border-white/[0.08] rounded-xl p-4 shadow-2xl text-xs space-y-3 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShinyText 
                text="Telemetria de Varredura em Tempo Real"
                className="font-mono text-zinc-100 text-xs font-bold uppercase tracking-wider"
                shimmerColor="rgba(245, 158, 11, 0.9)"
              />
              <span className="bg-[#181b24] text-amber-400 border border-white/[0.08] font-mono text-[10px] px-2 py-0.5 rounded-full font-medium">
                {currentStep}/{totalSteps} • {progressPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 bg-[#08090d] px-2 py-1 rounded-md border border-white/[0.06]">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{elapsedSeconds}s decorridos</span>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              title="Fechar telemetria"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#08090d] h-2 rounded-full overflow-hidden border border-white/[0.06]">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            hasError
              ? 'bg-rose-500'
              : isComplete
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stepper Compacto Untitled UI */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
        {STEPS_DESCRIPTION.map((desc, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum || isComplete;
          const isCurrent = currentStep === stepNum && !isComplete && !hasError;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-[11px] font-sans flex items-center gap-2 transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : isCurrent
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 ring-1 ring-amber-500/20'
                  : 'bg-[#090a0f] border-white/[0.06] text-zinc-500'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-[9px] font-mono">
                    {stepNum}
                  </span>
                )}
              </div>
              <span className="truncate font-medium">{desc}</span>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Console */}
      <div className="bg-[#08090d] border border-white/[0.08] rounded-xl p-3 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1.5 shadow-inner">
        {logs.length === 0 ? (
          <div className="text-zinc-600">Aguardando início dos processos...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-zinc-600 text-[10px] shrink-0">[{log.timestamp}]</span>
              <span
                className={`font-semibold shrink-0 uppercase text-[9px] px-1.5 py-0.2 rounded ${
                  log.type === 'error'
                    ? 'bg-rose-500/20 text-rose-300'
                    : log.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : log.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {log.type}
              </span>
              <span
                className={
                  log.type === 'error'
                    ? 'text-rose-400'
                    : log.type === 'success'
                    ? 'text-emerald-300'
                    : log.type === 'warning'
                    ? 'text-amber-300'
                    : 'text-zinc-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
