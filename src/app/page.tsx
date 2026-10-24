'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Map as MapIcon, 
  List, 
  Columns, 
  Activity,
  Radio,
  Radar,
  Sparkles,
  Layers
} from 'lucide-react';
import { Lead, ScraperHealthStatus, CrmStage, TelemetryLog } from '@/types';
import { OmniCommandBar } from '@/components/OmniCommandBar';
import { MapWrapper } from '@/components/MapWrapper';
import { LeadsTable, FilterPill } from '@/components/LeadsTable';
import { LeadDrawer } from '@/components/LeadDrawer';
import { LiveTelemetry } from '@/components/LiveTelemetry';
import { StatsOverview } from '@/components/StatsOverview';
import { GridBackground } from '@/components/react-bits/GridBackground';
import { ShinyText } from '@/components/react-bits/ShinyText';
import { DecryptedText } from '@/components/react-bits/DecryptedText';

type ViewMode = 'split' | 'map' | 'list';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scraperHealth, setScraperHealth] = useState<ScraperHealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeTableFilter, setActiveTableFilter] = useState<FilterPill>('all');

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

  const selectedLeadRef = React.useRef<Lead | null>(null);
  selectedLeadRef.current = selectedLead;

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
        if (selectedLeadRef.current) {
          const fresh = data.leads.find((l: Lead) => l.id === selectedLeadRef.current?.id);
          if (fresh) setSelectedLead(fresh);
        }
      }
    } catch (err) {
      console.error('Falha ao buscar leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  }, []);

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
    <main className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-amber-500/25 selection:text-amber-200">
      {/* React Bits: Subtle ambient dark grid background */}
      <GridBackground />

      {/* Untitled UI Executive Dark Header */}
      <header className="border-b border-white/[0.08] bg-[#0c0e14]/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Group */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Radar className="w-4 h-4 text-zinc-950 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="flex items-center gap-2">
            <ShinyText 
              text="LEAD INTEL HUB"
              className="text-xs md:text-sm font-bold tracking-wider uppercase text-white font-sans"
              shimmerColor="rgba(245, 158, 11, 0.95)"
            />
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800/80 text-amber-400 border border-white/[0.08]">
              <DecryptedText text="B2B RADAR v2.4" speed={30} maxIterations={8} animateOn="mount" />
            </span>
          </div>
        </div>

        {/* View Mode & Actions Group (Untitled UI segmented button) */}
        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#08090d] border border-white/[0.08] rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'split' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Visão Dividida (Mapa + Tabela)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'map' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Apenas Mapa"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mapa</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Apenas Lista"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => {
              fetchHealth();
              fetchLeads();
            }}
            className="text-zinc-400 hover:text-white bg-[#08090d] hover:bg-zinc-800/80 border border-white/[0.08] p-2 rounded-xl text-xs transition-all shadow-sm active:scale-95"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto px-4 md:px-6 py-5 flex flex-col gap-4 relative z-10">
        {/* KPI Stats Overview Cards */}
        <StatsOverview
          totalLeads={totalLeads}
          noSiteLeads={noSiteLeads}
          expiredSites={expiredSites}
          badSiteAdvertisers={badSiteAdvertisers}
          withWhatsApp={withWhatsApp}
          onFilterClick={(filterKey) => setActiveTableFilter(filterKey as FilterPill)}
        />

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

        {/* Live Execution Telemetry Stepper */}
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
        <div className="flex-1 min-h-[580px]">
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              <div className="lg:col-span-5 h-[420px] lg:h-[640px] sticky top-20">
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
                  activeFilter={activeTableFilter}
                  onFilterChange={setActiveTableFilter}
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
                activeFilter={activeTableFilter}
                onFilterChange={setActiveTableFilter}
              />
            </div>
          )}
        </div>
      </div>

      {/* Slide-Over Dossier Drawer */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLeadUpdated={handleLeadUpdated}
      />
    </main>
  );
}
