'use client';

import React from 'react';
import { 
  Building2, 
  Globe2, 
  AlertTriangle, 
  Zap, 
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { CountUp } from '@/components/react-bits/CountUp';

interface StatsOverviewProps {
  totalLeads: number;
  noSiteLeads: number;
  expiredSites: number;
  badSiteAdvertisers: number;
  withWhatsApp: number;
  onFilterClick?: (filterType: string) => void;
}

export function StatsOverview({
  totalLeads,
  noSiteLeads,
  expiredSites,
  badSiteAdvertisers,
  withWhatsApp,
  onFilterClick,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 1. Total da Base */}
      <div
        className="bg-[#0c0e14] border border-white/[0.08] hover:border-zinc-700/80 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        onClick={() => onFilterClick?.('all')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
            Base Mapeada
          </span>
          <div className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-300">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-white font-sans">
            <CountUp to={totalLeads} />
          </div>
          <span className="text-xs text-zinc-400">leads</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Radar ativo na região</span>
        </div>
      </div>

      {/* 2. Sem Site */}
      <div
        className="bg-[#0c0e14] border border-white/[0.08] hover:border-amber-500/40 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        onClick={() => onFilterClick?.('no_site')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium text-zinc-300 group-hover:text-amber-300 transition-colors">
            Sem Website
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-amber-300 font-sans">
            <CountUp to={noSiteLeads} />
          </div>
          <span className="text-xs text-amber-400/80 font-medium">oportunidades</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span className="truncate">Pitch: Criação de Site</span>
        </div>
      </div>

      {/* 3. Anúncios c/ Falhas */}
      <div
        className="bg-[#0c0e14] border border-white/[0.08] hover:border-rose-500/40 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        onClick={() => onFilterClick?.('bad_site_advertisers')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium text-zinc-300 group-hover:text-rose-300 transition-colors">
            Ads com Falhas
          </span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-rose-300 font-sans">
            <CountUp to={badSiteAdvertisers} />
          </div>
          <span className="text-xs text-rose-400/80 font-medium">queimando verba</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-400/90 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Pixel s/ SSL / não responsivo</span>
        </div>
      </div>

      {/* 4. Fora do Ar */}
      <div
        className="bg-[#0c0e14] border border-white/[0.08] hover:border-red-500/40 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        onClick={() => onFilterClick?.('site_down')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium text-zinc-300 group-hover:text-red-300 transition-colors">
            Site Fora do Ar
          </span>
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-red-300 font-sans">
            <CountUp to={expiredSites} />
          </div>
          <span className="text-xs text-red-400/80 font-medium">crítico</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <span className="truncate">Domínio expirado / 404 / 500</span>
        </div>
      </div>

      {/* 5. Contato WhatsApp */}
      <div
        className="bg-[#0c0e14] border border-white/[0.08] hover:border-emerald-500/40 rounded-xl p-4 transition-all cursor-pointer group shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1"
        onClick={() => onFilterClick?.('with_whatsapp')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium text-zinc-300 group-hover:text-emerald-300 transition-colors">
            WhatsApp Direto
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-emerald-300 font-sans">
            <CountUp to={withWhatsApp} />
          </div>
          <span className="text-xs text-emerald-400/80 font-medium">verificados</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">1-Click no WhatsApp</span>
        </div>
      </div>
    </div>
  );
}
