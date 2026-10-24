'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { 
  Target, 
  RefreshCw, 
  LayoutGrid, 
  Map as MapIcon, 
  List, 
  Columns, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Lead, ScrapingJob, ScraperHealthStatus, CrmStage, TelemetryLog } from '@/types';
import { OmniCommandBar } from '@/components/OmniCommandBar';
import { MapWrapper } from '@/components/MapWrapper';
import { LeadsTable } from '@/components/LeadsTable';
import { LeadDrawer } from '@/components/LeadDrawer';
import { LiveTelemetry } from '@/components/LiveTelemetry';

type ViewMode = 'split' | 'map' | 'list';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scraperHealth, setScraperHealth] = useState<ScraperHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Telemetria ao vivo
  const [isScanning, setIsScanning] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanError, setScanError] = useState(false);

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

  const addTelemetryLog = (step: number, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setCurrentStep(step);
    setTelemetryLogs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        step,
        totalSteps: 5,
        message,
        type,
      },
    ]);
  };

  const handleStartSearch = async (params: { query: string; location: string; depth: number; radius: number }) => {
    setIsScanning(true);
    setIsTelemetryOpen(true);
    setScanComplete(false);
    setScanError(false);
    setTelemetryLogs([]);
    setCurrentStep(1);

    addTelemetryLog(1, 'Iniciando pipeline de prospecção com auto-cura do Docker...', 'info');

    try {
      // Simulação progressiva visual enquanto a requisição roda no backend
      const progressTimer = setTimeout(() => {
        addTelemetryLog(2, `Geocodificando e delimitando perímetro para "${params.location}"...`, 'info');
      }, 1500);

      const res = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      clearTimeout(progressTimer);
      const data = await res.json();

      if (!res.ok) {
        setScanError(true);
        addTelemetryLog(currentStep, data.error || 'Erro na requisição da engine', 'error');
        throw new Error(data.error);
      }

      addTelemetryLog(4, 'Executando auditoria técnica determinística nos domínios...', 'info');
      addTelemetryLog(5, `Sucesso! ${data.total_found} leads qualificados e plotados na cartografia.`, 'success');
      setScanComplete(true);
      fetchLeads();
      fetchHealth();
    } catch (err) {
      setScanError(true);
      console.error('Erro na varredura:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBootDocker = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/scraper/boot', { method: 'POST' });
      const data = await res.json();
      setScraperHealth({ online: data.online, url: 'http://localhost:8080', error: data.error });
      fetchHealth();
    } catch {
      setScraperHealth({ online: false, url: 'http://localhost:8080' });
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      const res = await fetch('/api/scraper/seed', { method: 'POST' });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Falha ao semear demonstração:', err);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleUpdateCrmStage = async (leadId: string, newStage: CrmStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, crm_stage: newStage } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, crm_stage: newStage } : null));
    }

    try {
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

  // Métricas compactas para barra superior (sem 5 cards soltos)
  const totalLeads = leads.length;
  const noSiteLeads = leads.filter(
    (l) => l.website_type === 'none' || l.website_type === 'social_or_linktree'
  ).length;
  const expiredSites = leads.filter((l) => l.site_status === 'offline_or_expired').length;
  const badSiteAdvertisers = leads.filter(
    (l) => (l.has_meta_pixel || l.has_google_tags) && (!l.has_ssl || !l.is_responsive)
  ).length;
  const withWhatsApp = leads.filter((l) => Boolean(l.whatsapp_link)).length;

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Header Operacional Sóbrio e de Alta Densidade (Design Impeccable) */}
      <header className="border-b border-slate-800/80 bg-[#090d16] sticky top-0 z-30 px-4 lg:px-6 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600/10 border border-sky-500/30 flex items-center justify-center">
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">
              Lead Intel Hub
            </h1>
            <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              v2.0 • Operate Mode
            </span>
          </div>
        </div>

        {/* Telemetria de Métricas Inline (Compact & High Contrast) */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">
            Total: <strong className="text-slate-100 font-bold">{totalLeads}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-medium">
            Sem Site: <strong>{noSiteLeads}</strong>
          </span>
          {expiredSites > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-medium">
                Fora do Ar: <strong>{expiredSites}</strong>
              </span>
            </>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-rose-300 font-medium">
            Anúncios c/ Falha: <strong>{badSiteAdvertisers}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-medium">
            WhatsApp: <strong>{withWhatsApp}</strong>
          </span>
        </div>

        {/* Seletor de Layout (Split, Mapa, Lista) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition ${
                viewMode === 'split' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visão Dividida (Mapa + Tabela)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded transition ${
                viewMode === 'map' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Apenas Mapa"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition ${
                viewMode === 'list' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Apenas Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              fetchHealth();
              fetchLeads();
            }}
            className="text-slate-400 hover:text-slate-200 bg-[#070b14] border border-slate-800 p-2 rounded-lg text-xs transition"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal do Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-5 flex flex-col gap-4">
        {/* Omni-Command Bar (Barra de Comando Centralizada Estilo Raycast/Linear) */}
        <OmniCommandBar
          onSearch={handleStartSearch}
          isRunning={isScanning}
          scraperHealth={scraperHealth}
          checkingHealth={checkingHealth}
          onRefreshHealth={fetchHealth}
          onBootDocker={handleBootDocker}
          onSeedDemo={handleSeedDemo}
        />

        {/* Live Execution Telemetry (Aura Campaigns / LeadRadar) */}
        <LiveTelemetry
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
          logs={telemetryLogs}
          currentStep={currentStep}
          totalSteps={5}
          isComplete={scanComplete}
          hasError={scanError}
        />

        {/* Workspace Split-View: Mapa Interativo Exato + Lista Tática */}
        <div className="flex-1 min-h-[580px]">
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* Lado Esquerdo: Mapa Interativo Exato com Pinos Coloridos */}
              <div className="lg:col-span-5 h-[420px] lg:h-[640px] sticky top-20">
                <MapWrapper
                  leads={leads}
                  selectedLead={selectedLead}
                  onSelectLead={handleSelectLead}
                />
              </div>

              {/* Lado Direito: Lista/Tabela de Alta Densidade */}
              <div className="lg:col-span-7 flex flex-col h-full">
                <LeadsTable
                  leads={leads}
                  selectedLeadId={selectedLead?.id || null}
                  onSelectLead={handleSelectLead}
                  onUpdateCrmStage={handleUpdateCrmStage}
                  onLocateOnMap={(lead) => setSelectedLead(lead)}
                />
              </div>
            </div>
          )}

          {viewMode === 'map' && (
            <div className="w-full h-[680px]">
              <MapWrapper
                leads={leads}
                selectedLead={selectedLead}
                onSelectLead={handleSelectLead}
              />
            </div>
          )}

          {viewMode === 'list' && (
            <div className="w-full">
              <LeadsTable
                leads={leads}
                selectedLeadId={selectedLead?.id || null}
                onSelectLead={handleSelectLead}
                onUpdateCrmStage={handleUpdateCrmStage}
                onLocateOnMap={(lead) => {
                  setSelectedLead(lead);
                  setViewMode('split');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Drawer Lateral de Raio-X com 3 Abas & Dossiê */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLeadUpdated={handleLeadUpdated}
      />
    </main>
  );
}
