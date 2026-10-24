'use client';

import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MessageCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight, 
  Download, 
  MapPin, 
  Search,
  Filter
} from 'lucide-react';
import { Lead, CrmStage } from '@/types';
import { ScoreRing } from './ScoreRing';

interface LeadsTableProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateCrmStage: (leadId: string, newStage: CrmStage) => void;
  onLocateOnMap?: (lead: Lead) => void;
}

type FilterPill = 'all' | 'no_site' | 'site_down' | 'bad_site_advertisers' | 'with_whatsapp' | 'high_score';

export function LeadsTable({
  leads,
  selectedLeadId,
  onSelectLead,
  onUpdateCrmStage,
  onLocateOnMap,
}: LeadsTableProps) {
  const [activeFilter, setActiveFilter] = useState<FilterPill>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCat = (lead.category || '').toLowerCase().includes(q);
        const matchesLoc = `${lead.neighborhood || ''} ${lead.city || ''}`.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesLoc) return false;
      }

      if (activeFilter === 'no_site') {
        return lead.website_type === 'none' || lead.website_type === 'social_or_linktree';
      }
      if (activeFilter === 'site_down') {
        return lead.site_status === 'offline_or_expired';
      }
      if (activeFilter === 'bad_site_advertisers') {
        const isAd = lead.has_meta_pixel || lead.has_google_tags;
        const isBad = !lead.has_ssl || !lead.is_responsive || lead.site_status === 'offline_or_expired';
        return isAd && isBad;
      }
      if (activeFilter === 'with_whatsapp') {
        return Boolean(lead.whatsapp_link);
      }
      if (activeFilter === 'high_score') {
        return lead.opportunity_score >= 75;
      }

      return true;
    });
  }, [leads, activeFilter, searchFilter]);

  const counts = useMemo(() => {
    return {
      all: leads.length,
      no_site: leads.filter((l) => l.website_type === 'none' || l.website_type === 'social_or_linktree').length,
      site_down: leads.filter((l) => l.site_status === 'offline_or_expired').length,
      bad_site_advertisers: leads.filter((l) => (l.has_meta_pixel || l.has_google_tags) && (!l.has_ssl || !l.is_responsive)).length,
      with_whatsapp: leads.filter((l) => Boolean(l.whatsapp_link)).length,
      high_score: leads.filter((l) => l.opportunity_score >= 75).length,
    };
  }, [leads]);

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['Nome', 'Categoria', 'Bairro', 'Cidade', 'Telefone', 'WhatsApp', 'Nota', 'Avaliações', 'Site', 'Status Site', 'Score', 'Oportunidades', 'Estágio CRM'];
    const rows = filteredLeads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${(l.neighborhood || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.whatsapp_link || '').replace(/"/g, '""')}"`,
      l.rating,
      l.reviews_count,
      `"${(l.raw_website || '').replace(/"/g, '""')}"`,
      `"${l.site_status}"`,
      l.opportunity_score,
      `"${l.opportunity_tags.join('; ')}"`,
      `"${l.crm_stage}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_intel_hub_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0b1324] border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Barra de Filtros em Pills e Ação de Exportar */}
      <div className="p-3.5 border-b border-slate-800 bg-[#070b14] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeFilter === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setActiveFilter('no_site')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeFilter === 'no_site'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Sem Site ({counts.no_site})
          </button>

          {counts.site_down > 0 && (
            <button
              onClick={() => setActiveFilter('site_down')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeFilter === 'site_down'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 border border-rose-500/30'
              }`}
            >
              ⚠️ Fora do Ar ({counts.site_down})
            </button>
          )}

          <button
            onClick={() => setActiveFilter('bad_site_advertisers')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeFilter === 'bad_site_advertisers'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Anunciam c/ Site Ruim ({counts.bad_site_advertisers})
          </button>

          <button
            onClick={() => setActiveFilter('with_whatsapp')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeFilter === 'with_whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Com WhatsApp ({counts.with_whatsapp})
          </button>

          <button
            onClick={() => setActiveFilter('high_score')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeFilter === 'high_score'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Score &gt; 75 ({counts.high_score})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar por nome, nicho..."
              className="bg-[#090d16] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 w-44 md:w-56"
            />
          </div>

          <button
            onClick={handleExportCSV}
            title="Exportar para planilha CSV"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Tabela de Alta Densidade e Contraste */}
      <div className="overflow-x-auto flex-1 max-h-[560px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-[#070b14] border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Score</th>
              <th className="py-2.5 px-3">Empresa &amp; Local</th>
              <th className="py-2.5 px-3">Prova Social</th>
              <th className="py-2.5 px-3">Diagnóstico Técnico</th>
              <th className="py-2.5 px-3">Contato Rápido</th>
              <th className="py-2.5 px-3">CRM Pipeline</th>
              <th className="py-2.5 px-2 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">
                  Nenhum lead encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLeadId === lead.id;
                return (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      onSelectLead(lead);
                      onLocateOnMap?.(lead);
                    }}
                    className={`cursor-pointer transition group ${
                      isSelected
                        ? 'bg-sky-950/25 border-l-2 border-sky-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* 1. Score Ring */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <ScoreRing score={lead.opportunity_score} size={36} strokeWidth={3.5} />
                    </td>

                    {/* 2. Empresa & Local */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="font-semibold text-slate-100 text-xs truncate group-hover:text-sky-300 transition">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="truncate">{lead.category || 'Geral'}</span>
                        {lead.neighborhood && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-mono text-[10px] truncate">
                              {lead.neighborhood}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 3. Prova Social */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-amber-400 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{lead.rating ? lead.rating.toFixed(1) : '—'}</span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({lead.reviews_count})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {lead.reviews_count >= 30 ? (
                          <span className="text-emerald-400 font-medium">Caixa / Ativo</span>
                        ) : (
                          <span>Iniciante</span>
                        )}
                      </div>
                    </td>

                    {/* 4. Diagnóstico Técnico */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {lead.site_status === 'offline_or_expired' ? (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5">
                            <ShieldAlert className="w-3 h-3" /> Fora do Ar
                          </span>
                        ) : lead.website_type === 'none' ? (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            Sem Site
                          </span>
                        ) : lead.website_type === 'social_or_linktree' ? (
                          <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            Linktree / Rede
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            Domínio
                          </span>
                        )}

                        {lead.website_type === 'custom_domain' && lead.site_status === 'online' && (
                          lead.has_ssl ? (
                            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px]" title="SSL HTTPS Ativo">
                              <ShieldCheck className="w-3 h-3" /> SSL
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-0.5 text-[10px] bg-rose-500/10 px-1 rounded font-medium" title="Sem SSL">
                              <ShieldAlert className="w-3 h-3" /> Sem SSL
                            </span>
                          )
                        )}

                        {lead.has_meta_pixel && (
                          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 px-1 py-0.5 rounded text-[9px] font-mono">
                            Pixel
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Contato Rápido */}
                    <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {lead.whatsapp_link ? (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(
                            `Olá! Vi o perfil da ${lead.name} no Google e gostaria de fazer uma pergunta rápida.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-2 py-1 rounded text-[11px] transition font-medium"
                          title="Abrir WhatsApp direto"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">
                          {lead.phone || 'Sem contato'}
                        </span>
                      )}
                    </td>

                    {/* 6. CRM Pipeline */}
                    <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.crm_stage}
                        onChange={(e) => onUpdateCrmStage(lead.id, e.target.value as CrmStage)}
                        className="bg-[#090d16] border border-slate-800 text-slate-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-sky-500 transition"
                      >
                        <option value="new">Novo</option>
                        <option value="qualified">Qualificado</option>
                        <option value="contacted">Contatado</option>
                        <option value="negotiating">Negociando</option>
                        <option value="won">Ganho</option>
                        <option value="discarded">Descartado</option>
                      </select>
                    </td>

                    {/* 7. Ação */}
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => {
                          onSelectLead(lead);
                          onLocateOnMap?.(lead);
                        }}
                        className="text-slate-400 hover:text-sky-400 p-1 rounded transition"
                        title="Ver Raio-X & Localizar no Mapa"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
