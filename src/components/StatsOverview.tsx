'use client';

import React from 'react';
import { 
  Building2, 
  Globe2, 
  AlertTriangle, 
  Zap, 
  MessageCircle,
  TrendingUp,
  Flame
} from 'lucide-react';
import { SpotlightCard } from '@/components/react-bits/SpotlightCard';
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
      <SpotlightCard
        className="bg-[#0b0d13]/80 backdrop-blur border border-white/[0.08] p-3.5 hover:border-white/[0.18] transition-all cursor-pointer group"
        spotlightColor="rgba(255, 255, 255, 0.08)"
        onClick={() => onFilterClick?.('all')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide text-zinc-400 group-hover:text-zinc-200 transition-colors">
            Base Mapeada
          </span>
          <div className="p-1.5 rounded-lg bg-zinc-800/50 border border-white/[0.06] text-zinc-300">
            <Building2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-white font-sans">
            <CountUp to={totalLeads} />
          </div>
          <span className="text-[10px] font-mono text-zinc-500">leads</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>Radar ativo na região</span>
        </div>
      </SpotlightCard>

      {/* 2. Sem Site / Linktree */}
      <SpotlightCard
        className="bg-[#0b0d13]/80 backdrop-blur border border-white/[0.08] p-3.5 hover:border-amber-500/30 transition-all cursor-pointer group"
        spotlightColor="rgba(245, 158, 11, 0.12)"
        onClick={() => onFilterClick?.('no_site')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide text-zinc-400 group-hover:text-amber-300 transition-colors">
            Sem Website
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-amber-300 font-sans">
            <CountUp to={noSiteLeads} />
          </div>
          <span className="text-[10px] font-mono text-amber-500/80">oportunidades</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400/90 font-medium">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Pitch: Criação de Site</span>
        </div>
      </SpotlightCard>

      {/* 3. Anúncios c/ Falhas */}
      <SpotlightCard
        className="bg-[#0b0d13]/80 backdrop-blur border border-white/[0.08] p-3.5 hover:border-rose-500/30 transition-all cursor-pointer group"
        spotlightColor="rgba(244, 63, 94, 0.12)"
        onClick={() => onFilterClick?.('bad_site_advertisers')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide text-zinc-400 group-hover:text-rose-300 transition-colors">
            Ads com Falhas
          </span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-rose-400 font-sans">
            <CountUp to={badSiteAdvertisers} />
          </div>
          <span className="text-[10px] font-mono text-rose-400/80">queimando $$</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-400 font-medium">
          <AlertTriangle className="w-3 h-3" />
          <span>Meta/Google Pixel s/ SSL</span>
        </div>
      </SpotlightCard>

      {/* 4. Fora do Ar */}
      <SpotlightCard
        className="bg-[#0b0d13]/80 backdrop-blur border border-white/[0.08] p-3.5 hover:border-red-500/30 transition-all cursor-pointer group"
        spotlightColor="rgba(239, 68, 68, 0.12)"
        onClick={() => onFilterClick?.('site_down')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide text-zinc-400 group-hover:text-red-300 transition-colors">
            Site Fora do Ar
          </span>
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-red-400 font-sans">
            <CountUp to={expiredSites} />
          </div>
          <span className="text-[10px] font-mono text-red-400/80">crítico</span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400">
          <span>Domínio expirado / 404 / 500</span>
        </div>
      </SpotlightCard>

      {/* 5. Contato WhatsApp */}
      <SpotlightCard
        className="bg-[#0b0d13]/80 backdrop-blur border border-white/[0.08] p-3.5 hover:border-emerald-500/30 transition-all cursor-pointer group col-span-2 lg:col-span-1"
        spotlightColor="rgba(16, 185, 129, 0.12)"
        onClick={() => onFilterClick?.('with_whatsapp')}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-[11px] font-medium tracking-wide text-zinc-400 group-hover:text-emerald-300 transition-colors">
            WhatsApp Direto
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight text-emerald-400 font-sans">
            <CountUp to={withWhatsApp} />
          </div>
          <span className="text-[10px] font-mono text-emerald-500/80">prontos</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>1-Click no WhatsApp</span>
        </div>
      </SpotlightCard>
    </div>
  );
}
