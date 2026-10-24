'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Map as MapIcon, 
  List, 
  Columns, 
  Activity,
  Radio
} from 'lucide-react';
import { Lead, ScraperHealthStatus, CrmStage, TelemetryLog } from '@/types';
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

    addTelemetryLog(1, 'Iniciando varredura e checando engine Docker...', 'info');

    try {
      const progressTimer = setTimeout(() => {
        addTelemetryLog(2, `Geocodificando coordenadas para "${params.location}"...`, 'info');
      }, 1400);

      const res = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      clearTimeout(progressTimer);
      const data = await res.json();

      if (!res.ok) {
        setScanError(true);
        addTelemetryLog(currentStep, data.error || 'Falha na engine', 'error');
        throw new Error(data.error);
      }

      addTelemetryLog(4, 'Executando auditoria técnica determinística (Zero-Token)...', 'info');
      addTelemetryLog(5, `Varredura concluída: ${data.total_found} leads processados.`, 'success');
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
    <main className="min-h-screen bg-[#090a0c] text-[#f4f4f6] flex flex-col font-sans">
      {/* Header Operacional - Identidade Industrial & Editorial */}
      <header className="border-b border-white/[0.08] bg-[#0d0e11] sticky top-0 z-30 px-4 lg:px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Monograma Tipográfico Exclusivo */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold bg-[#1d1f24] text-[#f59e0b] border border-white/[0.1] px-1.5 py-0.5 rounded tracking-tighter">
              LIH
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold tracking-wider uppercase text-white font-mono">
                LEADINTEL
              </span>
              <span className="text-[10px] text-[#52525b] font-mono">
                // RADAR B2B
              </span>
            </div>
          </div>
        </div>

        {/* Telemetria de Métricas Inline */}
        <div className="hidden md:flex items-center gap-3.5 text-xs font-mono">
          <span className="text-[#a1a1aa]">
            BASE: <strong className="text-white font-medium">{totalLeads}</strong>
          </span>
          <span className="text-[#3f3f46]">•</span>
          <span className="text-[#fbbf24]">
            SEM SITE: <strong>{noSiteLeads}</strong>
          </span>
          {expiredSites > 0 && (
            <>
              <span className="text-[#3f3f46]">•</span>
              <span className="text-rose-400">
                FORA DO AR: <strong>{expiredSites}</strong>
              </span>
            </>
          )}
          <span className="text-[#3f3f46]">•</span>
          <span className="text-[#f43f5e]">
            ANÚNCIOS C/ FALHA: <strong>{badSiteAdvertisers}</strong>
          </span>
          <span className="text-[#3f3f46]">•</span>
          <span className="text-emerald-400">
            WHATSAPP: <strong>{withWhatsApp}</strong>
          </span>
        </div>

        {/* Seletor de Visão & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#141518] border border-white/[0.08] rounded p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1 rounded transition ${
                viewMode === 'split' ? 'bg-[#27272a] text-white' : 'text-[#71717a] hover:text-[#f4f4f6]'
              }`}
              title="Visão Dividida"
            >
              <Columns className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1 rounded transition ${
                viewMode === 'map' ? 'bg-[#27272a] text-white' : 'text-[#71717a] hover:text-[#f4f4f6]'
              }`}
              title="Apenas Mapa"
            >
              <MapIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition ${
                viewMode === 'list' ? 'bg-[#27272a] text-white' : 'text-[#71717a] hover:text-[#f4f4f6]'
              }`}
              title="Apenas Lista"
            >
              <List className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => {
              fetchHealth();
              fetchLeads();
            }}
            className="text-[#71717a] hover:text-[#f4f4f6] bg-[#141518] border border-white/[0.08] p-1.5 rounded text-xs transition"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3 h-3 ${loadingLeads ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 md:px-5 py-4 flex flex-col gap-3.5">
        {/* Omni-Command Bar */}
        <OmniCommandBar
          onSearch={handleStartSearch}
          isRunning={isScanning}
          scraperHealth={scraperHealth}
          checkingHealth={checkingHealth}
          onRefreshHealth={fetchHealth}
          onBootDocker={handleBootDocker}
          onSeedDemo={handleSeedDemo}
        />

        {/* Live Execution Telemetry */}
        <LiveTelemetry
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
          logs={telemetryLogs}
          currentStep={currentStep}
          totalSteps={5}
          isComplete={scanComplete}
          hasError={scanError}
        />

        {/* Split View: Mapa + Tabela */}
        <div className="flex-1 min-h-[560px]">
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full">
              <div className="lg:col-span-5 h-[380px] lg:h-[620px] sticky top-16">
                <MapWrapper
                  leads={leads}
                  selectedLead={selectedLead}
                  onSelectLead={handleSelectLead}
                />
              </div>

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
            <div className="w-full h-[660px]">
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

      {/* Drawer Lateral */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLeadUpdated={handleLeadUpdated}
      />
    </main>
  );
}
