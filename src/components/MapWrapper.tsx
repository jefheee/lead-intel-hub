'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Lead } from '@/types';
import { MapPin, Compass } from 'lucide-react';

interface MapWrapperProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  center?: [number, number];
  zoom?: number;
  searchRadius?: number;
}

const DynamicInteractiveMap = dynamic(
  () => import('./InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] rounded-xl border border-white/[0.08] bg-[#0c0e14] flex flex-col items-center justify-center text-zinc-500 gap-3 shadow-2xl">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-amber-500/20 animate-ping absolute" />
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-5 h-5 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-zinc-300">Carregando Cartografia Tática...</p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Renderização Leaflet Dark Mode</p>
        </div>
      </div>
    ),
  }
);

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicInteractiveMap {...props} />;
}
