'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, Loader2, AlertCircle, X, Clock } from 'lucide-react';
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
  'Verificação e auto-início do Motor Docker na porta 8080',
  'Geocodificação e delimitação geográfica do alvo',
  'Varredura no Google Maps em tempo real',
  'Auditoria Técnica Zero-Token (SSL, Stack, Pixels, Linktree, WhatsApp)',
  'Cálculo do Opportunity Score e plotagem cartográfica',
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
    <div className="bg-[#0b1324] border border-sky-500/30 rounded-xl p-4 shadow-xl text-xs space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-100 tracking-wide uppercase text-[11px]">
            Telemetria de Varredura ao Vivo
          </span>
          <span className="bg-sky-500/10 text-sky-400 font-mono text-[10px] px-2 py-0.5 rounded">
            Passo {currentStep}/{totalSteps} ({progressPercentage}%)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{elapsedSeconds}s</span>
          </div>

          {isComplete && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Progresso Fluida */}
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 ${
            hasError ? 'bg-rose-500' : isComplete ? 'bg-emerald-500' : 'bg-sky-500 animate-pulse'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stepper Visual Etapa por Etapa */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5 pt-1">
        {STEPS_DESCRIPTION.map((desc, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum || isComplete;
          const isCurrent = currentStep === stepNum && !isComplete && !hasError;
          const isPending = currentStep < stepNum;

          return (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-[10px] flex items-start gap-1.5 transition ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : isCurrent
                  ? 'bg-sky-950/30 border-sky-500/40 text-sky-200 ring-1 ring-sky-500/30'
                  : 'bg-[#090d16] border-slate-800 text-slate-500'
              }`}
            >
              <span className="shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center font-mono text-[9px]">
                    {stepNum}
                  </span>
                )}
              </span>
              <span className="leading-tight line-clamp-2">{desc}</span>
            </div>
          );
        })}
      </div>

      {/* Console de Terminal de Logs */}
      <div className="bg-[#050811] rounded-lg border border-slate-800/80 p-2.5 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1 text-slate-300 select-text">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="text-slate-600 shrink-0">{log.timestamp}</span>
            <span
              className={
                log.type === 'error'
                  ? 'text-rose-400'
                  : log.type === 'success'
                  ? 'text-emerald-400'
                  : log.type === 'warning'
                  ? 'text-amber-400'
                  : 'text-sky-300'
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
