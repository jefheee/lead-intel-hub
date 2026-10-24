'use client';

import React, { useState, useMemo } from 'react';
import { 
  Star, 
  ExternalLink, 
  MessageCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Monitor, 
  Code, 
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Lead, CrmStage } from '@/types';

interface LeadsTableProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateCrmStage: (leadId: string, newStage: CrmStage) => void;
}

type FilterPill = 'all' | 'no_site' | 'bad_site_advertisers' | 'with_whatsapp' | 'high_score';

export function LeadsTable({
  leads,
  selectedLeadId,
  onSelectLead,
  onUpdateCrmStage,
}: LeadsTableProps) {
  const [activeFilter, setActiveFilter] = useState<FilterPill>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Busca textual
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCat = (lead.category || '').toLowerCase().includes(q);
        const matchesLoc = `${lead.neighborhood || ''} ${lead.city || ''}`.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesLoc) return false;
      }

      // Filtros rápidos
      if (activeFilter === 'no_site') {
        return lead.website_type === 'none' || lead.website_type === 'social_or_linktree';
      }
      if (activeFilter === 'bad_site_advertisers') {
        const isAd = lead.has_meta_pixel || lead.has_google_tags;
        const isBad = !lead.has_ssl || !lead.is_responsive || (lead.pagespeed_mobile_score !== null && lead.pagespeed_mobile_score < 50);
        return isAd && isBad;
      }
      if (activeFilter === 'with_whatsapp') {
        return Boolean(lead.whatsapp_link);
      }
      if (activeFilter === 'high_score') {
        return lead.opportunity_score >= 70;
      }

      return true;
    });
  }, [leads, activeFilter, searchFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-slate-600';
  };

  const counts = useMemo(() => {
    return {
      all: leads.length,
      no_site: leads.filter((l) => l.website_type === 'none' || l.website_type === 'social_or_linktree').length,
      bad_site_advertisers: leads.filter((l) => (l.has_meta_pixel || l.has_google_tags) && (!l.has_ssl || !l.is_responsive)).length,
      with_whatsapp: leads.filter((l) => Boolean(l.whatsapp_link)).length,
      high_score: leads.filter((l) => l.opportunity_score >= 70).length,
    };
  }, [leads]);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Barra de Filtros e Busca */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090d16]/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => setActiveFilter('no_site')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'no_site'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Sem Site (Ouro) ({counts.no_site})
          </button>
          <button
            onClick={() => setActiveFilter('bad_site_advertisers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'bad_site_advertisers'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Anunciantes c/ Site Ruim ({counts.bad_site_advertisers})
          </button>
          <button
            onClick={() => setActiveFilter('with_whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'with_whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Com WhatsApp ({counts.with_whatsapp})
          </button>
          <button
            onClick={() => setActiveFilter('high_score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === 'high_score'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Score &gt; 70 ({counts.high_score})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar por nome, nicho ou bairro..."
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-[#090d16] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Empresa</th>
              <th className="py-3 px-3">Prova Social</th>
              <th className="py-3 px-3">Diagnóstico Digital</th>
              <th className="py-3 px-3">Score &amp; Oportunidade</th>
              <th className="py-3 px-3">Contato Rápido</th>
              <th className="py-3 px-3">Pipeline CRM</th>
              <th className="py-3 px-3 text-right">Ação</th>
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
                    onClick={() => onSelectLead(lead)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-sky-950/25 border-l-2 border-sky-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* 1. Empresa */}
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-semibold text-slate-100 text-sm truncate group-hover:text-sky-300 transition">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="truncate">{lead.category || 'Geral'}</span>
                        {lead.neighborhood && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {lead.neighborhood}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 2. Prova Social */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-amber-400">
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

                    {/* 3. Diagnóstico Digital */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Status do Website */}
                        {lead.website_type === 'none' && (
                          <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-medium">
                            Sem Site
                          </span>
                        )}
                        {lead.website_type === 'social_or_linktree' && (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-medium">
                            Rede / Linktree
                          </span>
                        )}
                        {lead.website_type === 'custom_domain' && (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                            Domínio
                          </span>
                        )}

                        {/* SSL */}
                        {lead.website_type === 'custom_domain' && (
                          lead.has_ssl ? (
                            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px]" title="SSL HTTPS Ativo">
                              <ShieldCheck className="w-3 h-3" /> SSL
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-0.5 text-[10px] bg-rose-500/10 px-1 rounded" title="Sem SSL (HTTP inseguro)">
                              <ShieldAlert className="w-3 h-3" /> Sem SSL
                            </span>
                          )
                        )}

                        {/* Meta Pixel */}
                        {lead.has_meta_pixel && (
                          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded text-[9px] font-mono">
                            Pixel
                          </span>
                        )}

                        {/* CMS */}
                        {lead.cms_or_stack && (
                          <span className="text-slate-400 text-[10px] font-mono">
                            {lead.cms_or_stack.split(',')[0]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Score de Oportunidade */}
                    <td className="py-3.5 px-3 min-w-[140px]">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className={`px-1.5 py-0.5 rounded border text-[11px] ${getScoreColor(lead.opportunity_score)}`}>
                          {lead.opportunity_score} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getScoreProgressColor(lead.opportunity_score)}`}
                          style={{ width: `${lead.opportunity_score}%` }}
                        />
                      </div>
                      {lead.opportunity_tags.length > 0 && (
                        <div className="text-[10px] text-slate-400 truncate mt-1">
                          {lead.opportunity_tags[0]}
                        </div>
                      )}
                    </td>

                    {/* 5. Contato Rápido */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {lead.whatsapp_link ? (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(
                            `Olá! Vi o perfil da ${lead.name} no Google e gostaria de fazer uma pergunta rápida.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-2.5 py-1 rounded text-xs transition font-medium"
                          title="Abrir WhatsApp Web direto"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          {lead.phone || 'Sem contato'}
                        </span>
                      )}
                    </td>

                    {/* 6. Pipeline CRM */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.crm_stage}
                        onChange={(e) => onUpdateCrmStage(lead.id, e.target.value as CrmStage)}
                        className="bg-[#090d16] border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-sky-500 transition"
                      >
                        <option value="new">Novo</option>
                        <option value="qualified">Qualificado</option>
                        <option value="contacted">Contatado</option>
                        <option value="negotiating">Negociando</option>
                        <option value="won">Ganho (Fechou)</option>
                        <option value="discarded">Descartado</option>
                      </select>
                    </td>

                    {/* 7. Ação de Raio-X */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="text-slate-400 hover:text-sky-400 p-1 rounded transition"
                        title="Ver Raio-X Completo"
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
