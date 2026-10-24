'use client';

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Server, 
  RefreshCw, 
  Database, 
  Tag, 
  Power,
  Compass,
  Sparkles
} from 'lucide-react';
import { parseNaturalSearchQuery } from '@/lib/query-parser';
import { ScraperHealthStatus } from '@/types';
import { SpotlightCard } from '@/components/react-bits/SpotlightCard';

interface OmniCommandBarProps {
  onSearch: (params: { query: string; location: string; depth: number; radius: number }) => void;
  isRunning: boolean;
  scraperHealth: ScraperHealthStatus | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
  onBootDocker: () => void;
  onSeedDemo: () => void;
}

export function OmniCommandBar({
  onSearch,
  isRunning,
  scraperHealth,
  checkingHealth,
  onRefreshHealth,
  onBootDocker,
  onSeedDemo,
}: OmniCommandBarProps) {
  const [naturalInput, setNaturalInput] = useState('Pizzarias no bairro Jardim Eldorado em Palhoça');
  const [niche, setNiche] = useState('Pizzarias');
  const [location, setLocation] = useState('Jardim Eldorado, Palhoça - SC');
  const [radiusKm, setRadiusKm] = useState(10);
  const [depth, setDepth] = useState(5);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const handleInputChange = (val: string) => {
    setNaturalInput(val);
    const parsed = parseNaturalSearchQuery(val);
    if (parsed.niche) setNiche(parsed.niche);
    if (parsed.location) setLocation(parsed.location);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.municipality || 'Região Atual';
            const state = data.address?.state_code || data.address?.state || '';
            const locName = `${city}${state ? ' - ' + state : ''}`;
            setLocation(locName);
            setNaturalInput(`${niche || 'Empresas'} em ${locName}`);
          }
        } catch (err) {
          console.warn('Erro ao obter localização reversa:', err);
        } finally {
          setIsGpsLoading(false);
        }
      },
      (err) => {
        setIsGpsLoading(false);
        console.warn('Falha GPS:', err.message);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNiche = niche.trim() || 'Empresas';
    const finalLocation = location.trim() || 'Palhoça - SC';
    onSearch({
      query: finalNiche,
      location: finalLocation,
      depth,
      radius: radiusKm * 1000,
    });
  };

  const isDockerOnline = scraperHealth?.online;

  return (
    <SpotlightCard 
      className="bg-[#0c0e14]/90 backdrop-blur-md border border-white/[0.08] shadow-2xl p-4 md:p-5"
      spotlightColor="rgba(245, 158, 11, 0.08)"
    >
      <div className="flex flex-col gap-3.5">
        {/* Main Search Input: Untitled UI Command Bar style */}
        <form onSubmit={handleSubmit} className="relative flex items-center group">
          <div className="absolute left-3.5 text-zinc-500 group-focus-within:text-amber-400 transition-colors pointer-events-none flex items-center">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={naturalInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="O que e onde você quer prospectar? (ex: Clínicas odontológicas em Jardim Eldorado, Palhoça)"
            className="w-full bg-[#08090d]/90 border border-white/[0.08] hover:border-white/[0.16] focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-36 py-3.5 text-xs md:text-sm text-zinc-100 placeholder:text-zinc-500 font-sans focus:outline-none transition-all shadow-inner"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={isRunning}
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all active:scale-[0.98]"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>Varrendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                  <span>Executar</span>
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-medium text-zinc-900 bg-amber-200/60 rounded">
                    ↵
                  </kbd>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Filters and Controls Strip: Untitled UI segmented tokens */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Target Parameters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Nicho Pill */}
            <div className="flex items-center gap-1.5 bg-[#090a0f] border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-2.5 py-1.5 transition-colors">
              <Tag className="w-3 h-3 text-amber-400" />
              <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Nicho:</span>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none font-medium w-24 md:w-28"
                placeholder="Ex: Clínicas"
              />
            </div>

            {/* Target Location Pill */}
            <div className="flex items-center gap-1.5 bg-[#090a0f] border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-2.5 py-1.5 transition-colors">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Alvo:</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none font-medium w-32 md:w-44"
                placeholder="Cidade / Bairro"
              />
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isGpsLoading}
              className="flex items-center gap-1.5 bg-[#12141c] hover:bg-[#181b24] border border-white/[0.08] text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              title="Obter coordenadas GPS atuais"
            >
              <Compass className={`w-3.5 h-3.5 text-amber-400 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>{isGpsLoading ? 'Localizando...' : 'GPS'}</span>
            </button>

            {/* Search Radius Pill */}
            <div className="flex items-center gap-1.5 bg-[#090a0f] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px]">
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Raio:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-transparent text-zinc-200 focus:outline-none text-[11px] cursor-pointer font-medium"
              >
                <option value={3} className="bg-[#0f1219]">3 km</option>
                <option value={5} className="bg-[#0f1219]">5 km</option>
                <option value={10} className="bg-[#0f1219]">10 km</option>
                <option value={15} className="bg-[#0f1219]">15 km</option>
                <option value={25} className="bg-[#0f1219]">25 km</option>
              </select>
            </div>

            {/* Depth Level Pill */}
            <div className="flex items-center gap-1.5 bg-[#090a0f] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px]">
              <span className="text-zinc-500 font-mono text-[10px] uppercase">Depth:</span>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="bg-transparent text-zinc-200 focus:outline-none text-[11px] cursor-pointer font-medium"
              >
                <option value={3} className="bg-[#0f1219]">3 (~40 leads)</option>
                <option value={5} className="bg-[#0f1219]">5 (~70 leads)</option>
                <option value={10} className="bg-[#0f1219]">10 (~140 leads)</option>
                <option value={20} className="bg-[#0f1219]">20 (~250 leads)</option>
              </select>
            </div>
          </div>

          {/* Docker & Demo Actions (Untitled UI Status Pill) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#090a0f] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-[11px]">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-500 font-mono text-[10px]">8080:</span>
              {checkingHealth ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Testando...
                </span>
              ) : isDockerOnline ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Online
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Offline
                  </span>
                  <button
                    type="button"
                    onClick={onBootDocker}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition font-medium"
                  >
                    <Power className="w-2.5 h-2.5" /> Ligar Docker
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onSeedDemo}
              className="bg-[#12141c] hover:bg-[#191c26] border border-white/[0.08] text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Carregar leads com coordenadas para teste imediato"
            >
              <Database className="w-3 h-3 text-amber-400" />
              <span>Carregar Demo</span>
            </button>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
