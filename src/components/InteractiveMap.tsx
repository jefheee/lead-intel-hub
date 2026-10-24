'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Lead } from '@/types';
import { MessageCircle, Star, ShieldAlert } from 'lucide-react';

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
    if (selectedLead && selectedLead.latitude && selectedLead.longitude) {
      map.flyTo([selectedLead.latitude, selectedLead.longitude], 16, {
        duration: 1.0,
      });
    } else if (center) {
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
    () => leads.filter((l) => l.latitude !== null && l.longitude !== null),
    [leads]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedLead && selectedLead.latitude && selectedLead.longitude) {
      return [selectedLead.latitude, selectedLead.longitude];
    }
    if (validLeads.length > 0) {
      const avgLat = validLeads.reduce((a, b) => a + (b.latitude || 0), 0) / validLeads.length;
      const avgLon = validLeads.reduce((a, b) => a + (b.longitude || 0), 0) / validLeads.length;
      return [avgLat, avgLon];
    }
    return center;
  }, [validLeads, selectedLead, center]);

  const createCustomIcon = (lead: Lead, isSelected: boolean) => {
    let pinBg = 'bg-[#27272a] text-[#a1a1aa] border-[#3f3f46]';
    let pulse = '';

    if (lead.site_status === 'offline_or_expired' || ((lead.has_meta_pixel || lead.has_google_tags) && !lead.has_ssl)) {
      pinBg = 'bg-[#e11d48] text-white border-[#f43f5e]';
      pulse = 'ring-2 ring-rose-500/40';
    } else if (lead.opportunity_score >= 75 || lead.website_type === 'none') {
      pinBg = 'bg-[#d97706] text-[#0a0a0c] border-[#f59e0b] font-bold';
      pulse = 'ring-2 ring-amber-500/40';
    } else if (lead.whatsapp_link) {
      pinBg = 'bg-[#059669] text-white border-[#10b981]';
    }

    if (isSelected) {
      pulse = 'ring-4 ring-white scale-125 z-50';
    }

    const html = `
      <div class="relative group cursor-pointer flex items-center justify-center transition-transform">
        <div class="w-6 h-6 rounded-md border ${pinBg} ${pulse} shadow-md flex items-center justify-center text-[10px] font-mono">
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
    <div className="w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-white/[0.08] relative shadow-inner bg-[#0d0e11]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10 dark-tiles"
        style={{ background: '#0d0e11' }}
      >
        {/* OpenStreetMap Padrão com Filtro CSS Dark Tático (Zero API Key, Zero Watermark) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController selectedLead={selectedLead} center={mapCenter} />

        {/* Círculo do raio da busca tático */}
        {validLeads.length > 0 && (
          <Circle
            center={mapCenter}
            radius={searchRadius}
            pathOptions={{
              color: '#d97706',
              fillColor: '#f59e0b',
              fillOpacity: 0.04,
              weight: 1.5,
              dashArray: '3, 6',
            }}
          />
        )}

        {/* Marcadores dos Leads */}
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
                <div className="p-3 text-xs bg-[#121316] text-[#e4e4e7] rounded-lg max-w-[240px] space-y-2 border border-white/[0.1] shadow-2xl font-sans">
                  <div className="flex items-start justify-between gap-1.5 border-b border-white/[0.08] pb-1.5">
                    <div>
                      <div className="font-semibold text-white text-xs leading-tight line-clamp-1">
                        {lead.name}
                      </div>
                      <div className="text-[10px] text-[#a1a1aa] mt-0.5">
                        {lead.category || 'Geral'} • {lead.neighborhood || lead.city}
                      </div>
                    </div>
                    <span className="shrink-0 bg-[#27272a] text-[#f59e0b] font-mono text-[10px] px-1.5 py-0.5 rounded font-bold border border-white/[0.08]">
                      {lead.opportunity_score}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
                    <span className="flex items-center gap-0.5 text-[#fbbf24] font-medium">
                      <Star className="w-3 h-3 fill-[#fbbf24]" />
                      {lead.rating.toFixed(1)} ({lead.reviews_count})
                    </span>
                    {lead.site_status === 'offline_or_expired' ? (
                      <span className="text-rose-400 text-[10px] flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" /> Fora do ar
                      </span>
                    ) : lead.website_type === 'none' ? (
                      <span className="text-amber-400 text-[10px]">Sem site</span>
                    ) : (
                      <span className="text-[#a1a1aa] text-[10px]">Site próprio</span>
                    )}
                  </div>

                  <div className="pt-1 flex gap-1.5">
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="flex-1 bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium py-1 px-2 rounded text-[11px] transition text-center border border-white/[0.08]"
                    >
                      Raio-X
                    </button>
                    {lead.whatsapp_link && (
                      <a
                        href={lead.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#059669] hover:bg-[#10b981] text-white py-1 px-2 rounded text-[11px] flex items-center justify-center transition"
                        title="WhatsApp"
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

      {/* Legenda Tática de Instrumentação */}
      <div className="absolute bottom-2.5 left-2.5 z-[400] bg-[#111215]/95 backdrop-blur border border-white/[0.08] rounded-md px-2.5 py-1 text-[10px] font-mono text-[#a1a1aa] flex items-center gap-3 shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[#d97706]" /> Ouro (&gt;75 / Sem Site)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[#e11d48]" /> Fora do ar / Falha
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[#059669]" /> WhatsApp
        </span>
      </div>
    </div>
  );
}
