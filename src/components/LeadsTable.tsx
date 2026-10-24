'use client';

import React, { useState, useMemo } from 'react';
import { 
  Star, 
  MessageCircle, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight, 
  Download, 
  Search,
  Building,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpDown,
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
  activeFilter?: FilterPill;
  onFilterChange?: (filter: FilterPill) => void;
}

export type FilterPill = 'all' | 'no_site' | 'site_down' | 'bad_site_advertisers' | 'with_whatsapp' | 'high_score';

export function LeadsTable({
  leads,
  selectedLeadId,
  onSelectLead,
  onUpdateCrmStage,
  onLocateOnMap,
  activeFilter: externalFilter,
  onFilterChange: externalFilterChange,
}: LeadsTableProps) {
  const [internalFilter, setInternalFilter] = useState<FilterPill>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const activeFilter = externalFilter !== undefined ? externalFilter : internalFilter;
  const setActiveFilter = (filter: FilterPill) => {
    if (externalFilterChange) {
      externalFilterChange(filter);
    } else {
      setInternalFilter(filter);
    }
  };

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

  const getStageBadgeColor = (stage: CrmStage) => {
    switch (stage) {
      case 'new': return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
      case 'qualified': return 'border-amber-500/30 text-amber-300 bg-amber-500/10';
      case 'contacted': return 'border-purple-500/30 text-purple-300 bg-purple-500/10';
      case 'negotiating': return 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10';
      case 'won': return 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10';
      case 'discarded': return 'border-zinc-700 text-zinc-500 bg-zinc-800/40';
      default: return 'border-zinc-700 text-zinc-300 bg-zinc-800';
    }
  };

  return (
    <div className="bg-[#0b0d13] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* Filter Bar & Quick Search */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#0c0e14] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills with Badge Counters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span>Todos</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${
              activeFilter === 'all' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('no_site')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'no_site'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Sem Site</span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
              {counts.no_site}
            </span>
          </button>

          {counts.site_down > 0 && (
            <button
              onClick={() => setActiveFilter('site_down')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeFilter === 'site_down'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-zinc-400 hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Fora do Ar</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300">
                {counts.site_down}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveFilter('bad_site_advertisers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'bad_site_advertisers'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Ads Falhos</span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300">
              {counts.bad_site_advertisers}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('with_whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'with_whatsapp'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>WhatsApp</span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
              {counts.with_whatsapp}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('high_score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === 'high_score'
                ? 'bg-amber-400 text-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <span>Score 75+</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${
              activeFilter === 'high_score' ? 'bg-zinc-900 text-amber-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {counts.high_score}
            </span>
          </button>
        </div>

        {/* Search & Export Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por nome, nicho..."
              className="bg-[#0e1017] border border-white/[0.08] hover:border-white/[0.15] focus:border-amber-500/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-all w-44 md:w-52"
            />
          </div>

          <button
            onClick={handleExportCSV}
            title="Exportar Lista em CSV"
            className="bg-[#12141c] hover:bg-[#1a1c26] border border-white/[0.08] text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="font-mono text-xs text-zinc-400">CSV</span>
          </button>
        </div>
      </div>

      {/* Untitled UI High-Density Table */}
      <div className="overflow-x-auto flex-1 max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-[#0c0e14] border-b border-white/[0.08] text-zinc-400 font-sans font-medium text-xs">
            <tr>
              <th className="py-2.5 px-3.5 w-14">Score</th>
              <th className="py-2.5 px-3.5">Empresa &amp; Local</th>
              <th className="py-2.5 px-3.5">Avaliações</th>
              <th className="py-2.5 px-3.5">Diagnóstico Técnico</th>
              <th className="py-2.5 px-3.5">Contato</th>
              <th className="py-2.5 px-3.5">Pipeline CRM</th>
              <th className="py-2.5 px-3 text-right">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-zinc-500 font-sans text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-6 h-6 text-zinc-600" />
                    <p className="font-medium text-zinc-400">Nenhum lead encontrado com os filtros atuais.</p>
                    <button
                      onClick={() => {
                        setActiveFilter('all');
                        setSearchFilter('');
                      }}
                      className="text-amber-400 hover:underline text-xs"
                    >
                      Limpar filtros
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLeadId === lead.id;
                const companyInitials = lead.name.slice(0, 2).toUpperCase();

                return (
                  <tr
                    key={lead.id}
                    onClick={() => {
                      onSelectLead(lead);
                      onLocateOnMap?.(lead);
                    }}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-amber-500/[0.07] border-l-2 border-amber-400'
                        : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    {/* 1. Score Ring */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <ScoreRing score={lead.opportunity_score} size={32} strokeWidth={2.8} />
                    </td>

                    {/* 2. Empresa & Local com Avatar Chip */}
                    <td className="py-3 px-3.5 max-w-[230px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0 group-hover:border-amber-500/40 transition-colors">
                          {companyInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-100 text-xs truncate group-hover:text-amber-300 transition-colors">
                            {lead.name}
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 font-sans truncate">
                            <span className="truncate">{lead.category || 'Geral'}</span>
                            {lead.neighborhood && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-400 truncate">{lead.neighborhood}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Avaliações */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-medium">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-mono font-semibold">{lead.rating ? lead.rating.toFixed(1) : '—'}</span>
                        </div>
                        <span className="text-zinc-400 text-xs">
                          ({lead.reviews_count})
                        </span>
                      </div>
                    </td>

                    {/* 4. Diagnóstico Técnico */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {lead.site_status === 'offline_or_expired' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Fora do Ar
                          </span>
                        ) : lead.website_type === 'none' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Sem Site
                          </span>
                        ) : lead.website_type === 'social_or_linktree' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Linktree
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Domínio
                          </span>
                        )}

                        {lead.website_type === 'custom_domain' && lead.site_status === 'online' && (
                          lead.has_ssl ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" /> SSL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20">
                              <ShieldAlert className="w-3 h-3" /> Sem SSL
                            </span>
                          )
                        )}

                        {lead.has_meta_pixel && (
                          <span className="px-1.5 py-0.5 rounded-md text-xs font-mono font-medium text-zinc-300 bg-zinc-800/90 border border-zinc-700">
                            Pixel
                          </span>
                        )}
                        {lead.has_google_tags && (
                          <span className="px-1.5 py-0.5 rounded-md text-xs font-mono font-medium text-zinc-300 bg-zinc-800/90 border border-zinc-700">
                            G-Tag
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. Contato Rápido */}
                    <td className="py-3 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {lead.whatsapp_link ? (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(
                            `Olá! Vi o perfil da ${lead.name} no Google e gostaria de fazer uma pergunta rápida.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-zinc-950 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs transition-colors font-medium active:scale-95 shadow-sm"
                          title="Iniciar conversa no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-xs font-mono">
                          {lead.phone || 'Sem contato'}
                        </span>
                      )}
                    </td>

                    {/* 6. Pipeline CRM */}
                    <td className="py-3 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.crm_stage}
                        onChange={(e) => onUpdateCrmStage(lead.id, e.target.value as CrmStage)}
                        className={`border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none transition-colors cursor-pointer ${getStageBadgeColor(lead.crm_stage)}`}
                      >
                        <option value="new" className="bg-[#0f1219] text-zinc-200">Novo</option>
                        <option value="qualified" className="bg-[#0f1219] text-amber-300">Qualificado</option>
                        <option value="contacted" className="bg-[#0f1219] text-purple-300">Contatado</option>
                        <option value="negotiating" className="bg-[#0f1219] text-cyan-300">Negociando</option>
                        <option value="won" className="bg-[#0f1219] text-emerald-300">Ganho</option>
                        <option value="discarded" className="bg-[#0f1219] text-zinc-500">Descartado</option>
                      </select>
                    </td>

                    {/* 7. Ação de Abertura */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectLead(lead);
                          onLocateOnMap?.(lead);
                        }}
                        className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Abrir dossiê completo"
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

      {/* Table Footer */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-[#0c0e14] flex items-center justify-between text-xs text-zinc-400">
        <span>
          Mostrando <strong className="text-zinc-200">{filteredLeads.length}</strong> de <strong className="text-zinc-200">{leads.length}</strong> empresas
        </span>
        <span className="font-mono text-xs text-zinc-400">
          Status: Atualizado em tempo real
        </span>
      </div>
    </div>
  );
}
