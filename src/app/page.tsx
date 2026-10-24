'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Target, 
  TrendingUp, 
  MessageCircle, 
  ShieldAlert, 
  Zap, 
  Layers, 
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Lead, ScrapingJob, ScraperHealthStatus, CrmStage } from '@/types';
import { CaptureRadar } from '@/components/CaptureRadar';
import { LeadsTable } from '@/components/LeadsTable';
import { LeadDrawer } from '@/components/LeadDrawer';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scraperHealth, setScraperHealth] = useState<ScraperHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/scraper/status');
      const data = await res.json();
      setScraperHealth(data);
    } catch {
      setScraperHealth({ online: false, url: 'http://localhost:8080' });
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
        // Atualiza lead selecionado se estiver aberto
        if (selectedLead) {
          const fresh = data.leads.find((l: Lead) => l.id === selectedLead.id);
          if (fresh) setSelectedLead(fresh);
        }
      }
    } catch (err) {
      console.error('Falha ao buscar leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [selectedLead]);

  useEffect(() => {
    fetchHealth();
    fetchLeads();
  }, [fetchHealth, fetchLeads]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleUpdateCrmStage = async (leadId: string, newStage: CrmStage) => {
    try {
      // Atualização otimista
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, crm_stage: newStage } : l))
      );
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, crm_stage: newStage } : null));
      }

      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crm_stage: newStage }),
      });
    } catch (err) {
      console.error('Erro ao atualizar estágio do CRM:', err);
    }
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setSelectedLead(updatedLead);
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
  };

  // Métricas de inteligência comercial
  const totalLeads = leads.length;
  const noSiteLeads = leads.filter(
    (l) => l.website_type === 'none' || l.website_type === 'social_or_linktree'
  ).length;
  const badSiteAdvertisers = leads.filter(
    (l) => (l.has_meta_pixel || l.has_google_tags) && (!l.has_ssl || !l.is_responsive)
  ).length;
  const withWhatsApp = leads.filter((l) => Boolean(l.whatsapp_link)).length;
  const avgScore = totalLeads
    ? Math.round(leads.reduce((acc, curr) => acc + (curr.opportunity_score || 0), 0) / totalLeads)
    : 0;

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 pb-16">
      {/* Topo Operacional */}
      <header className="border-b border-slate-800 bg-[#0c1322]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  Lead Intel Hub
                </h1>
                <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono px-2 py-0.5 rounded font-medium">
                  Zero-Token Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Prospecção, Enriquecimento e Auditoria Técnica de Negócios Locais B2B
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchHealth();
                fetchLeads();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Métricas do Funil */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total de Leads</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
              {totalLeads}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Capturados e indexados</div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
              <span>Sem Site (Ouro)</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              {noSiteLeads}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Landing page urgente</div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
              <span>Anúncios c/ Falhas</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">
              {badSiteAdvertisers}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Gastando com tráfego</div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Com WhatsApp</span>
              <MessageCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {withWhatsApp}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Contato imediato</div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Score Médio</span>
              <BarChart3 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400 mt-1 font-mono">
              {avgScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Potencial da base</div>
          </div>
        </div>

        {/* Painel de Captura (Radar Local) */}
        <CaptureRadar
          scraperHealth={scraperHealth}
          checkingHealth={checkingHealth}
          onRefreshHealth={fetchHealth}
          onScrapeSuccess={fetchLeads}
          onSeedSuccess={fetchLeads}
        />

        {/* Tabela Inteligente de Leads & Filtros */}
        <LeadsTable
          leads={leads}
          selectedLeadId={selectedLead?.id || null}
          onSelectLead={handleSelectLead}
          onUpdateCrmStage={handleUpdateCrmStage}
        />
      </div>

      {/* Drawer Lateral de Raio-X do Lead */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLeadUpdated={handleLeadUpdated}
      />
    </main>
  );
}
