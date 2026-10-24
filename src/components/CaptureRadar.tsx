'use client';

import React, { useState } from 'react';
import { Play, RefreshCw, Server, AlertTriangle, CheckCircle2, Database, ShieldAlert } from 'lucide-react';
import { ScraperHealthStatus } from '@/types';

interface CaptureRadarProps {
  scraperHealth: ScraperHealthStatus | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
  onScrapeSuccess: () => void;
  onSeedSuccess: () => void;
}

export function CaptureRadar({
  scraperHealth,
  checkingHealth,
  onRefreshHealth,
  onScrapeSuccess,
  onSeedSuccess,
}: CaptureRadarProps) {
  const [query, setQuery] = useState('Pizzarias');
  const [location, setLocation] = useState('Palhoça - SC');
  const [depth, setDepth] = useState('5');
  const [isRunning, setIsRunning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) {
      setErrorMsg('Preencha o nicho e a localização para varredura.');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location,
          depth: parseInt(depth, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao executar o scraper');
      }

      setSuccessMsg(`Varredura concluída! ${data.total_found} leads capturados e qualificados.`);
      onScrapeSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao iniciar varredura.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSeedSamples = async () => {
    setIsSeeding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/scraper/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar amostras');
      setSuccessMsg('4 leads de demonstração carregados e auditados!');
      onSeedSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao carregar amostras');
    } finally {
      setIsSeeding(false);
    }
  };

  const isOnline = scraperHealth?.online;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <h2 className="text-base font-semibold text-slate-100 uppercase tracking-wider text-xs">
              Radar Local de Captação
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Varredura no Google Maps via engine local (porta 8080) com qualificação técnica determinística
          </p>
        </div>

        {/* Status da Engine Docker */}
        <div className="flex items-center gap-2 bg-[#090d16] px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Docker Engine:</span>
          {checkingHealth ? (
            <span className="text-amber-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
            </span>
          ) : isOnline ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              Online (8080)
            </span>
          ) : (
            <span className="text-rose-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Offline
            </span>
          )}
          <button
            onClick={onRefreshHealth}
            title="Recarregar status da porta 8080"
            className="text-slate-400 hover:text-slate-200 ml-1 transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <form onSubmit={handleStartScan} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Nicho / Palavra-chave
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Clínicas, Pizzarias, Construtoras"
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Bairro / Cidade
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Jardim Eldorado, Palhoça - SC"
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Depth
          </label>
          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-2 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
          >
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={isRunning}
            className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Varrendo...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Escanear</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Alerta de status ou erro */}
      {errorMsg && (
        <div className="mt-3 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Falha ao conectar com o motor de busca</p>
              <p className="mt-0.5 text-slate-300">{errorMsg}</p>
              {!isOnline && (
                <p className="mt-1.5 font-mono text-[11px] bg-slate-900/80 px-2 py-1 rounded text-slate-400">
                  Execute no terminal: docker compose -f C:\Projetos\google-maps-scraper-kit\docker-compose.yml up -d
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSeedSamples}
            disabled={isSeeding}
            className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Usar Amostras Demo</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
