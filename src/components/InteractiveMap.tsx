'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Lead } from '@/types';
import { MessageCircle, ExternalLink, Star, ShieldAlert } from 'lucide-react';

interface InteractiveMapProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  center?: [number, number];
  zoom?: number;
  searchRadius?: number;
}

// Corretor de centro automático ao selecionar lead
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
        duration: 1.2,
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
  center = [-27.6441, -48.6710], // Palhoça / Florianópolis default
  zoom = 13,
  searchRadius = 5000,
}: InteractiveMapProps) {
  // Pinos com coordenadas estritamente válidas
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

  // Calcula centro se existirem leads
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
    let pinBg = 'bg-slate-500 border-slate-300';
    let pulse = '';

    if (lead.site_status === 'offline_or_expired' || ((lead.has_meta_pixel || lead.has_google_tags) && !lead.has_ssl)) {
      pinBg = 'bg-rose-500 border-rose-200 text-white';
      pulse = 'ring-4 ring-rose-500/30';
    } else if (lead.opportunity_score >= 75 || lead.website_type === 'none') {
      pinBg = 'bg-amber-500 border-amber-200 text-slate-950 font-bold';
      pulse = 'ring-4 ring-amber-500/30';
    } else if (lead.whatsapp_link) {
      pinBg = 'bg-emerald-500 border-emerald-200 text-white';
    }

    if (isSelected) {
      pulse = 'ring-4 ring-sky-400 scale-125 z-50';
    }

    const html = `
      <div class="relative group cursor-pointer flex items-center justify-center transition-transform">
        <div class="w-7 h-7 rounded-full border-2 ${pinBg} ${pulse} shadow-lg flex items-center justify-center text-[10px] font-mono font-bold">
          ${lead.opportunity_score}
        </div>
        <div class="w-1.5 h-1.5 bg-white rounded-full absolute -bottom-1 shadow"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-map-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  };

  return (
    <div className="w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-800 relative shadow-inner bg-[#090d16]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ background: '#090d16' }}
      >
        {/* Tiles Dark Matter da CartoDB (Gratuito & Limpo) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapController selectedLead={selectedLead} center={mapCenter} />

        {/* Círculo do raio da busca */}
        {validLeads.length > 0 && (
          <Circle
            center={mapCenter}
            radius={searchRadius}
            pathOptions={{
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '4, 8',
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
                <div className="p-2 text-xs bg-[#0b1324] text-slate-100 rounded-lg max-w-[240px] space-y-1.5 border border-slate-700 shadow-xl font-sans">
                  <div className="flex items-start justify-between gap-1.5 border-b border-slate-800 pb-1.5">
                    <div>
                      <div className="font-semibold text-slate-100 text-sm leading-tight line-clamp-1">
                        {lead.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {lead.category || 'Geral'} • {lead.neighborhood || lead.city}
                      </div>
                    </div>
                    <span className="shrink-0 bg-sky-500/20 text-sky-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {lead.opportunity_score} pts
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {lead.rating.toFixed(1)} ({lead.reviews_count})
                    </span>
                    {lead.site_status === 'offline_or_expired' ? (
                      <span className="text-rose-400 text-[10px] flex items-center gap-0.5">
                        <ShieldAlert className="w-3 h-3" /> Fora do ar
                      </span>
                    ) : lead.website_type === 'none' ? (
                      <span className="text-amber-400 text-[10px]">Sem site</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Site próprio</span>
                    )}
                  </div>

                  <div className="pt-1 flex gap-1.5">
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium py-1 px-2 rounded text-[10px] transition text-center"
                    >
                      Ver Raio-X
                    </button>
                    {lead.whatsapp_link && (
                      <a
                        href={lead.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-2 rounded text-[10px] flex items-center justify-center transition"
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

      {/* Legenda de Pinos no Canto Inferior */}
      <div className="absolute bottom-3 left-3 z-[400] bg-[#090d16]/90 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 flex items-center gap-3 shadow-md">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Oportunidade Ouro (&gt;75)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Site c/ Falhas / Fora do ar
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> WhatsApp Direto
        </span>
      </div>
    </div>
  );
}
