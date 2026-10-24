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
  ArrowRight
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
    <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-4 md:p-5 shadow-sm">
      <div className="flex flex-col gap-3.5">
        {/* Main Search Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center group">
          <div className="absolute left-3.5 text-zinc-400 group-focus-within:text-zinc-200 transition-colors pointer-events-none flex items-center">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={naturalInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="O que e onde você quer prospectar? (ex: Clínicas odontológicas em Palhoça)"
            className="w-full bg-[#08090d] border border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 rounded-lg pl-10 pr-36 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 font-sans focus:outline-none transition-all"
          />

          <div className="absolute right-1.5 flex items-center">
            <button
              type="submit"
              disabled={isRunning}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-[0.98]"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>Executar busca</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Filters and Controls Strip: Toolbar unificada (sem nested cards) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          {/* Target Parameters Toolbar */}
          <div className="flex flex-wrap items-center bg-[#08090d] border border-zinc-800/80 rounded-lg divide-x divide-zinc-800/80">
            {/* Nicho Field */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 text-xs font-medium">Nicho:</span>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none font-medium w-24 md:w-28"
                placeholder="Ex: Clínicas"
              />
            </div>

            {/* Target Location Field */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 text-xs font-medium">Local:</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none font-medium w-32 md:w-44"
                placeholder="Cidade / Bairro"
              />
            </div>

            {/* Raio */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <span className="text-zinc-400 font-medium">Raio:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-transparent text-zinc-200 focus:outline-none text-xs cursor-pointer font-medium"
              >
                <option value={3} className="bg-[#0c0e14]">3 km</option>
                <option value={5} className="bg-[#0c0e14]">5 km</option>
                <option value={10} className="bg-[#0c0e14]">10 km</option>
                <option value={15} className="bg-[#0c0e14]">15 km</option>
                <option value={25} className="bg-[#0c0e14]">25 km</option>
              </select>
            </div>

            {/* Profundidade */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <span className="text-zinc-400 font-medium">Profundidade:</span>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="bg-transparent text-zinc-200 focus:outline-none text-xs cursor-pointer font-medium"
              >
                <option value={3} className="bg-[#0c0e14]">Rápido (~40 leads)</option>
                <option value={5} className="bg-[#0c0e14]">Padrão (~70 leads)</option>
                <option value={10} className="bg-[#0c0e14]">Profundo (~140 leads)</option>
                <option value={20} className="bg-[#0c0e14]">Completo (~250 leads)</option>
              </select>
            </div>

            {/* GPS Button */}
            <div className="px-1.5 py-1">
              <button
                type="button"
                onClick={handleUseGps}
                disabled={isGpsLoading}
                className="flex items-center gap-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
                title="Obter coordenadas GPS atuais"
              >
                <Compass className={`w-3.5 h-3.5 text-zinc-400 ${isGpsLoading ? 'animate-spin' : ''}`} />
                <span>{isGpsLoading ? '...' : 'GPS'}</span>
              </button>
            </div>
          </div>

          {/* Docker & Demo Actions Toolbar */}
          <div className="flex items-center bg-[#08090d] border border-zinc-800/80 rounded-lg divide-x divide-zinc-800/80 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 font-medium">Scraper:</span>
              {checkingHealth ? (
                <span className="text-amber-300 flex items-center gap-1 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verificando
                </span>
              ) : isDockerOnline ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Pronto
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> Standby
                  </span>
                  <button
                    type="button"
                    onClick={onBootDocker}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-0.5 rounded text-xs flex items-center gap-1 transition font-medium"
                  >
                    <Power className="w-3 h-3 text-zinc-300" /> Iniciar
                  </button>
                </div>
              )}
            </div>

            <div className="px-1.5 py-1">
              <button
                type="button"
                onClick={onSeedDemo}
                className="hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Carregar leads de teste"
              >
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dados Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
