'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, Loader2, X, Clock, AlertCircle } from 'lucide-react';
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
  'Motor Scraper',
  'Geocodificação',
  'Varredura Maps',
  'Auditoria Web',
  'Score & CRM',
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
    <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-4 shadow-sm text-xs space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-amber-400/10 text-amber-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white">
              Telemetria de varredura
            </h2>
            <span className="bg-zinc-800 text-zinc-300 font-mono text-xs px-2 py-0.5 rounded font-medium">
              Etapa {currentStep} de {totalSteps} ({progressPercentage}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#08090d] text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedSeconds}s decorridos</span>
          </div>

          {(isComplete || hasError) && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              title="Fechar telemetria"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            hasError
              ? 'bg-rose-500'
              : isComplete
              ? 'bg-emerald-400'
              : 'bg-amber-400'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stepper Timeline Horizontal (Sem nested cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
        {STEPS_DESCRIPTION.map((desc, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum || isComplete;
          const isCurrent = currentStep === stepNum && !isComplete && !hasError;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 text-xs transition-colors ${
                isDone
                  ? 'text-emerald-300'
                  : isCurrent
                  ? 'text-amber-300 font-medium'
                  : 'text-zinc-500'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center font-mono text-xs text-zinc-500">
                    {stepNum}
                  </span>
                )}
              </div>
              <span className="truncate">{desc}</span>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Console */}
      <div className="bg-[#08090d] rounded-lg p-3 font-mono text-xs max-h-36 overflow-y-auto space-y-1.5 border border-zinc-800/80">
        {logs.length === 0 ? (
          <div className="text-zinc-500">Aguardando início dos processos...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-zinc-500 text-xs shrink-0">[{log.timestamp}]</span>
              <span
                className={`font-semibold shrink-0 uppercase text-xs px-1.5 py-0.5 rounded ${
                  log.type === 'error'
                    ? 'bg-rose-500/20 text-rose-300'
                    : log.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : log.type === 'warning'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {log.type}
              </span>
              <span className={`break-all text-xs ${log.type === 'error' ? 'text-rose-300' : 'text-zinc-200'}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
