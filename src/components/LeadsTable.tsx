'use client';

import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MessageCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight, 
  Download, 
  Search
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
    link.download = `leads_intel_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#111215] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Pills de Filtragem & Busca */}
      <div className="p-3 border-b border-white/[0.07] bg-[#0d0e11] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              activeFilter === 'all'
                ? 'bg-[#27272a] text-white border border-white/[0.2]'
                : 'text-[#a1a1aa] hover:text-[#f4f4f6] hover:bg-[#18191d]'
            }`}
          >
            Todos ({counts.all})
          </button>

          <button
            onClick={() => setActiveFilter('no_site')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              activeFilter === 'no_site'
                ? 'bg-[#d97706]/20 text-[#fbbf24] border border-[#f59e0b]/40'
                : 'text-[#a1a1aa] hover:text-[#f4f4f6] hover:bg-[#18191d]'
            }`}
          >
            Sem Site ({counts.no_site})
          </button>

          {counts.site_down > 0 && (
            <button
              onClick={() => setActiveFilter('site_down')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                activeFilter === 'site_down'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/50'
                  : 'text-rose-400 hover:bg-[#18191d]'
              }`}
            >
              Fora do Ar ({counts.site_down})
            </button>
          )}

          <button
            onClick={() => setActiveFilter('bad_site_advertisers')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              activeFilter === 'bad_site_advertisers'
                ? 'bg-rose-950/40 text-rose-300 border border-rose-500/50'
                : 'text-[#a1a1aa] hover:text-[#f4f4f6] hover:bg-[#18191d]'
            }`}
          >
            Anúncios c/ Falhas ({counts.bad_site_advertisers})
          </button>

          <button
            onClick={() => setActiveFilter('with_whatsapp')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              activeFilter === 'with_whatsapp'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                : 'text-[#a1a1aa] hover:text-[#f4f4f6] hover:bg-[#18191d]'
            }`}
          >
            WhatsApp ({counts.with_whatsapp})
          </button>

          <button
            onClick={() => setActiveFilter('high_score')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
              activeFilter === 'high_score'
                ? 'bg-[#27272a] text-[#f59e0b] border border-[#f59e0b]/40'
                : 'text-[#a1a1aa] hover:text-[#f4f4f6] hover:bg-[#18191d]'
            }`}
          >
            Score &gt; 75 ({counts.high_score})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar por nome..."
              className="bg-[#0a0b0d] border border-white/[0.08] rounded-md pl-8 pr-2.5 py-1 text-xs text-[#f4f4f6] placeholder:text-[#52525b] focus:outline-none focus:border-white/[0.2] w-40 md:w-48"
            />
          </div>

          <button
            onClick={handleExportCSV}
            title="Exportar CSV"
            className="bg-[#18191d] hover:bg-[#222429] border border-white/[0.08] text-[#d4d4d8] hover:text-white px-2 py-1 rounded-md text-xs font-mono flex items-center gap-1 transition"
          >
            <Download className="w-3 h-3 text-[#a1a1aa]" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Tabela de Alta Densidade */}
      <div className="overflow-x-auto flex-1 max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-[#0d0e11] border-b border-white/[0.08] text-[#71717a] font-mono uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2 px-3">Score</th>
              <th className="py-2 px-3">Empresa &amp; Local</th>
              <th className="py-2 px-3">Avaliações</th>
              <th className="py-2 px-3">Diagnóstico</th>
              <th className="py-2 px-3">Contato</th>
              <th className="py-2 px-3">Pipeline</th>
              <th className="py-2 px-2 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#71717a] font-mono text-xs">
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
                        ? 'bg-[#1a1c21] border-l-2 border-[#f59e0b]'
                        : 'hover:bg-[#15161a]'
                    }`}
                  >
                    {/* 1. Score */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <ScoreRing score={lead.opportunity_score} size={32} strokeWidth={2.8} />
                    </td>

                    {/* 2. Empresa & Local */}
                    <td className="py-2.5 px-3 max-w-[210px]">
                      <div className="font-medium text-[#f4f4f6] text-xs truncate group-hover:text-white transition">
                        {lead.name}
                      </div>
                      <div className="text-[10px] text-[#71717a] flex items-center gap-1 mt-0.5 font-mono">
                        <span className="truncate">{lead.category || 'Geral'}</span>
                        {lead.neighborhood && (
                          <>
                            <span className="text-[#3f3f46]">•</span>
                            <span className="text-[#a1a1aa] truncate">{lead.neighborhood}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 3. Avaliações */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[#fbbf24] text-xs font-mono font-medium">
                        <Star className="w-3 h-3 fill-[#fbbf24]" />
                        <span>{lead.rating ? lead.rating.toFixed(1) : '—'}</span>
                        <span className="text-[#71717a] font-normal text-[10px]">
                          ({lead.reviews_count})
                        </span>
                      </div>
                    </td>

                    {/* 4. Diagnóstico Técnico */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {lead.site_status === 'offline_or_expired' ? (
                          <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Fora do Ar
                          </span>
                        ) : lead.website_type === 'none' ? (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono">
                            Sem Site
                          </span>
                        ) : lead.website_type === 'social_or_linktree' ? (
                          <span className="bg-[#27272a] text-[#d4d4d8] border border-white/[0.08] px-1.5 py-0.5 rounded text-[10px] font-mono">
                            Linktree
                          </span>
                        ) : (
                          <span className="bg-[#18191d] text-[#a1a1aa] border border-white/[0.06] px-1.5 py-0.5 rounded text-[10px] font-mono">
                            Domínio
                          </span>
                        )}

                        {lead.website_type === 'custom_domain' && lead.site_status === 'online' && (
                          lead.has_ssl ? (
                            <span className="text-emerald-400 text-[10px] flex items-center gap-0.5 font-mono">
                              <ShieldCheck className="w-3 h-3" /> SSL
                            </span>
                          ) : (
                            <span className="text-rose-400 text-[10px] bg-rose-500/10 px-1 rounded font-mono">
                              Sem SSL
                            </span>
                          )
                        )}

                        {lead.has_meta_pixel && (
                          <span className="bg-[#27272a] text-[#a1a1aa] px-1 py-0.5 rounded text-[9px] font-mono">
                            Pixel
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Contato Rápido */}
                    <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {lead.whatsapp_link ? (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(
                            `Olá! Vi o perfil da ${lead.name} no Google e gostaria de fazer uma pergunta rápida.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-[#059669]/15 hover:bg-[#059669] text-[#34d399] hover:text-white border border-[#059669]/30 px-2 py-0.5 rounded text-[10px] transition font-mono font-medium"
                          title="WhatsApp direto"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-[#52525b] text-[10px] font-mono">
                          {lead.phone || 'Sem contato'}
                        </span>
                      )}
                    </td>

                    {/* 6. Pipeline */}
                    <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.crm_stage}
                        onChange={(e) => onUpdateCrmStage(lead.id, e.target.value as CrmStage)}
                        className="bg-[#0a0b0d] border border-white/[0.08] text-[#d4d4d8] text-[10px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-white/[0.2] transition"
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
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => {
                          onSelectLead(lead);
                          onLocateOnMap?.(lead);
                        }}
                        className="text-[#71717a] hover:text-[#f4f4f6] p-1 rounded transition"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
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
