'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Sliders, 
  Play, 
  Server, 
  RefreshCw, 
  Database, 
  Sparkles, 
  Tag, 
  Power
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

  // Auto-parse dinâmico conforme o usuário digita
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
          // Reverse geocoding via Nominatim
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
    <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
      {/* Barra de Comando Principal Estilo Raycast / Linear */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-sky-400 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-sky-400" />
        </div>

        <input
          type="text"
          value={naturalInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="O que e onde você quer prospectar? (ex: Clínicas odontológicas em Jardim Eldorado, Palhoça ou Pizzarias no Kobrasol)"
          className="w-full bg-[#070b14] border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl pl-12 pr-36 py-3.5 text-sm md:text-base text-slate-100 placeholder:text-slate-500 font-sans focus:outline-none transition shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={isRunning}
            className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs md:text-sm transition flex items-center gap-2 shadow-sm font-sans"
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

      {/* Chips Inteligentes & Controles de Precisão */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
        {/* Parâmetros Deduzidos e Editáveis */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chip Nicho */}
          <div className="flex items-center gap-1 bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300">
            <Tag className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-500 text-[10px] uppercase font-mono">Nicho:</span>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium w-28 md:w-32"
            />
          </div>

          {/* Chip Localização */}
          <div className="flex items-center gap-1 bg-[#090d16] border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500 text-[10px] uppercase font-mono">Alvo:</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium w-36 md:w-44"
            />
          </div>

          {/* Botão GPS */}
          <button
            type="button"
            onClick={handleUseGps}
            disabled={isGpsLoading}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg text-xs transition"
            title="Usar localização do navegador"
          >
            <Navigation className={`w-3.5 h-3.5 text-sky-400 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span>{isGpsLoading ? 'Buscando GPS...' : 'Meu GPS'}</span>
          </button>

          {/* Seletor de Raio */}
          <div className="flex items-center gap-1 bg-[#090d16] border border-slate-800 rounded-lg px-2 py-1 text-slate-400">
            <span className="text-[10px] uppercase font-mono text-slate-500">Raio:</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={25}>25 km</option>
            </select>
          </div>

          {/* Seletor de Profundidade */}
          <div className="flex items-center gap-1 bg-[#090d16] border border-slate-800 rounded-lg px-2 py-1 text-slate-400">
            <span className="text-[10px] uppercase font-mono text-slate-500">Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-transparent text-slate-200 focus:outline-none text-xs"
            >
              <option value={3}>3 (~40 leads)</option>
              <option value={5}>5 (~70 leads)</option>
              <option value={10}>10 (~140 leads)</option>
              <option value={20}>20 (~250 leads)</option>
            </select>
          </div>
        </div>

        {/* Status do Docker Engine + Botão de Demonstração */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#070b14] border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-mono text-[11px]">8080:</span>
            {checkingHealth ? (
              <span className="text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Verificando
              </span>
            ) : isDockerOnline ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Online
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Offline
                </span>
                <button
                  type="button"
                  onClick={onBootDocker}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 transition font-medium"
                  title="Executar auto-start do container Docker"
                >
                  <Power className="w-3 h-3" /> Auto-Iniciar
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSeedDemo}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium"
            title="Carregar 6 leads de demonstração com coordenadas exatas para testar o mapa imediatamente"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Dados Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
