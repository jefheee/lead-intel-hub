'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Lead } from '@/types';
import { MapPin } from 'lucide-react';

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
      <div className="w-full h-full min-h-[380px] rounded-xl border border-slate-800 bg-[#090d16] flex flex-col items-center justify-center text-slate-500 gap-2">
        <MapPin className="w-8 h-8 text-sky-500/40 animate-pulse" />
        <span className="text-xs font-mono">Renderizando Cartografia Tática...</span>
      </div>
    ),
  }
);

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicInteractiveMap {...props} />;
}
