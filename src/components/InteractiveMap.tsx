'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Lead } from '@/types';
import { MessageCircle, Star, ShieldAlert, ArrowRight } from 'lucide-react';

interface InteractiveMapProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  center?: [number, number];
  zoom?: number;
  searchRadius?: number;
}

function MapController({
  selectedLead,
  center,
}: {
  selectedLead: Lead | null;
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedLead &&
      typeof selectedLead.latitude === 'number' &&
      !isNaN(selectedLead.latitude) &&
      typeof selectedLead.longitude === 'number' &&
      !isNaN(selectedLead.longitude)
    ) {
      map.flyTo([selectedLead.latitude, selectedLead.longitude], 16, {
        duration: 1.0,
      });
    } else if (
      center &&
      typeof center[0] === 'number' &&
      !isNaN(center[0]) &&
      typeof center[1] === 'number' &&
      !isNaN(center[1])
    ) {
      map.flyTo(center, 13, { duration: 1.0 });
    }
  }, [selectedLead, center, map]);

  return null;
}

export default function InteractiveMap({
  leads,
  selectedLead,
  onSelectLead,
  center = [-27.6441, -48.6710],
  zoom = 13,
  searchRadius = 5000,
}: InteractiveMapProps) {
  const validLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          typeof l.latitude === 'number' &&
          !isNaN(l.latitude) &&
          typeof l.longitude === 'number' &&
          !isNaN(l.longitude)
      ),
    [leads]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (
      selectedLead &&
      typeof selectedLead.latitude === 'number' &&
      !isNaN(selectedLead.latitude) &&
      typeof selectedLead.longitude === 'number' &&
      !isNaN(selectedLead.longitude)
    ) {
      return [selectedLead.latitude, selectedLead.longitude];
    }
    if (validLeads.length > 0) {
      const avgLat = validLeads.reduce((a, b) => a + (b.latitude || 0), 0) / validLeads.length;
      const avgLon = validLeads.reduce((a, b) => a + (b.longitude || 0), 0) / validLeads.length;
      if (!isNaN(avgLat) && !isNaN(avgLon)) {
        return [avgLat, avgLon];
      }
    }
    return center;
  }, [validLeads, selectedLead, center]);

  const createCustomIcon = (lead: Lead, isSelected: boolean) => {
    let pinBg = 'bg-zinc-900 text-zinc-100 border-zinc-700';
    let ringClass = '';

    if (lead.site_status === 'offline_or_expired' || ((lead.has_meta_pixel || lead.has_google_tags) && !lead.has_ssl)) {
      pinBg = 'bg-rose-600 text-white border-rose-500 font-bold';
      ringClass = 'ring-2 ring-rose-400/30';
    } else if (lead.opportunity_score >= 75 || lead.website_type === 'none') {
      pinBg = 'bg-amber-400 text-zinc-950 border-amber-300 font-bold';
      ringClass = 'ring-2 ring-amber-400/30';
    } else if (lead.whatsapp_link) {
      pinBg = 'bg-emerald-600 text-white border-emerald-500 font-bold';
      ringClass = 'ring-2 ring-emerald-400/30';
    }

    if (isSelected) {
      ringClass = 'ring-2 ring-white scale-125 z-50 shadow-md';
    }

    const html = `
      <div class="relative group cursor-pointer flex items-center justify-center transition-transform">
        <div class="w-6 h-6 rounded-md border ${pinBg} ${ringClass} flex items-center justify-center text-xs font-mono shadow-sm">
          ${lead.opportunity_score}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-map-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    });
  };

  return (
    <div className="w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-white/[0.08] relative shadow-2xl bg-[#090a0f]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10 dark-tiles"
        style={{ background: '#090a0f' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController selectedLead={selectedLead} center={mapCenter} />

        {validLeads.length > 0 && (
          <Circle
            center={mapCenter}
            radius={searchRadius}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '4, 8',
            }}
          />
        )}

        {validLeads.map((lead) => {
          const isSelected = selectedLead?.id === lead.id;
          return (
            <Marker
              key={lead.id}
              position={[lead.latitude!, lead.longitude!]}
              icon={createCustomIcon(lead, isSelected)}
              eventHandlers={{
                click: () => onSelectLead(lead),
              }}
            >
              <Popup className="dark-leaflet-popup" closeButton={false}>
                <div className="p-3.5 text-xs bg-[#0c0e14] text-zinc-200 rounded-xl max-w-[250px] space-y-2.5 border border-white/[0.1] shadow-2xl font-sans">
                  <div className="flex items-start justify-between gap-2 border-b border-white/[0.08] pb-2">
                    <div>
                      <div className="font-semibold text-white text-xs leading-tight line-clamp-1">
                        {lead.name}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5 truncate">
                        {lead.category || 'Geral'} • {lead.neighborhood || lead.city}
                      </div>
                    </div>
                    <span className="shrink-0 bg-amber-400/10 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                      {lead.opportunity_score}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {lead.rating.toFixed(1)} ({lead.reviews_count})
                    </span>
                    <span className="text-zinc-600">•</span>
                    {lead.site_status === 'offline_or_expired' ? (
                      <span className="text-rose-400 text-xs flex items-center gap-0.5 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" /> Fora do ar
                      </span>
                    ) : lead.website_type === 'none' ? (
                      <span className="text-amber-400 text-xs font-medium">Sem site</span>
                    ) : (
                      <span className="text-zinc-400 text-xs">Site próprio</span>
                    )}
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-1.5 px-2.5 rounded-lg text-xs transition text-center border border-white/[0.08] flex items-center justify-center gap-1"
                    >
                      <span>Abrir Dossiê</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                    {lead.whatsapp_link && (
                      <a
                        href={lead.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-xs flex items-center justify-center transition shadow-sm"
                        title="Abrir no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-[#0c0e14]/95 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-2 text-xs font-sans text-zinc-300 flex items-center gap-4 shadow-md">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 
          Alta Prioridade (75+)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 
          Falhas / Fora do Ar
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> 
          WhatsApp Direto
        </span>
      </div>
    </div>
  );
}
