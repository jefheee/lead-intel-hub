'use client';

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Sliders, 
  CornerDownLeft, 
  Server, 
  RefreshCw, 
  Database, 
  Tag, 
  Power,
  Compass
} from 'lucide-react';
import { parseNaturalSearchQuery } from '@/lib/query-parser';
import { ScraperHealthStatus } from '@/types';

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
    <div className="bg-[#111215] border border-white/[0.08] rounded-xl p-3 md:p-4 shadow-xl space-y-3">
      {/* Omni-Command Input */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-[#71717a] flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-[#a1a1aa]" />
        </div>

        <input
          type="text"
          value={naturalInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="O que e onde você quer prospectar? (ex: Clínicas odontológicas em Jardim Eldorado, Palhoça)"
          className="w-full bg-[#0a0b0d] border border-white/[0.08] hover:border-white/[0.14] focus:border-white/[0.25] rounded-lg pl-10 pr-32 py-3 text-xs md:text-sm text-[#f4f4f6] placeholder:text-[#52525b] font-sans focus:outline-none transition shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={isRunning}
            className="bg-[#e4e4e7] hover:bg-white disabled:bg-[#27272a] text-[#090a0c] font-semibold px-3.5 py-1.5 rounded-md text-xs transition flex items-center gap-1.5 shadow-sm font-sans"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <span>Executar</span>
                <CornerDownLeft className="w-3 h-3 text-[#71717a]" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Controles de Precisão & Instrumentação */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Parâmetros Identificados */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Nicho */}
          <div className="flex items-center gap-1 bg-[#0a0b0d] border border-white/[0.07] rounded-md px-2.5 py-1 text-[#d4d4d8]">
            <Tag className="w-3 h-3 text-[#a1a1aa]" />
            <span className="text-[#71717a] text-[10px] uppercase font-mono">Nicho:</span>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-transparent text-[#e4e4e7] text-xs focus:outline-none font-medium w-24 md:w-28"
            />
          </div>

          {/* Localização */}
          <div className="flex items-center gap-1 bg-[#0a0b0d] border border-white/[0.07] rounded-md px-2.5 py-1 text-[#d4d4d8]">
            <MapPin className="w-3 h-3 text-[#a1a1aa]" />
            <span className="text-[#71717a] text-[10px] uppercase font-mono">Alvo:</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent text-[#e4e4e7] text-xs focus:outline-none font-medium w-32 md:w-40"
            />
          </div>

          {/* Botão GPS */}
          <button
            type="button"
            onClick={handleUseGps}
            disabled={isGpsLoading}
            className="flex items-center gap-1 bg-[#16171b] hover:bg-[#1f2025] border border-white/[0.08] text-[#a1a1aa] hover:text-[#f4f4f6] px-2 py-1 rounded-md text-[11px] transition"
            title="Usar coordenadas atuais do navegador"
          >
            <Compass className={`w-3 h-3 text-[#f59e0b] ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span>{isGpsLoading ? 'GPS...' : 'GPS'}</span>
          </button>

          {/* Raio */}
          <div className="flex items-center gap-1 bg-[#0a0b0d] border border-white/[0.07] rounded-md px-2 py-1 text-[#a1a1aa] text-[11px]">
            <span className="text-[10px] font-mono text-[#71717a]">Raio:</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="bg-transparent text-[#e4e4e7] focus:outline-none text-[11px]"
            >
              <option value={3} className="bg-[#111215]">3 km</option>
              <option value={5} className="bg-[#111215]">5 km</option>
              <option value={10} className="bg-[#111215]">10 km</option>
              <option value={15} className="bg-[#111215]">15 km</option>
              <option value={25} className="bg-[#111215]">25 km</option>
            </select>
          </div>

          {/* Depth */}
          <div className="flex items-center gap-1 bg-[#0a0b0d] border border-white/[0.07] rounded-md px-2 py-1 text-[#a1a1aa] text-[11px]">
            <span className="text-[10px] font-mono text-[#71717a]">Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-transparent text-[#e4e4e7] focus:outline-none text-[11px]"
            >
              <option value={3} className="bg-[#111215]">3 (~40)</option>
              <option value={5} className="bg-[#111215]">5 (~70)</option>
              <option value={10} className="bg-[#111215]">10 (~140)</option>
              <option value={20} className="bg-[#111215]">20 (~250)</option>
            </select>
          </div>
        </div>

        {/* Status do Docker Engine & Demonstração */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#0a0b0d] border border-white/[0.07] px-2 py-1 rounded-md text-[11px]">
            <Server className="w-3 h-3 text-[#71717a]" />
            <span className="text-[#71717a] font-mono text-[10px]">8080:</span>
            {checkingHealth ? (
              <span className="text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Verificando
              </span>
            ) : isDockerOnline ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" /> Online
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Offline
                </span>
                <button
                  type="button"
                  onClick={onBootDocker}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 transition font-medium"
                >
                  <Power className="w-2.5 h-2.5" /> Auto-Iniciar
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSeedDemo}
            className="bg-[#16171b] hover:bg-[#1f2025] border border-white/[0.08] text-[#e4e4e7] px-2.5 py-1 rounded-md text-[11px] transition flex items-center gap-1.5 font-medium"
            title="Carregar 6 leads com coordenadas exatas para teste imediato"
          >
            <Database className="w-3 h-3 text-[#f59e0b]" />
            <span>Dados Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
