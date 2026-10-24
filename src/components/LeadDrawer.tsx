'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  ExternalLink, 
  Star, 
  RefreshCw, 
  Sparkles, 
  Copy, 
  Check, 
  MessageCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Globe, 
  Mail, 
  Share2, 
  MapPin, 
  Printer, 
  Lightbulb,
  Building,
  ArrowUpRight
} from 'lucide-react';
import { Lead } from '@/types';
import { ScoreRing } from './ScoreRing';
import { generateSalesPlaybook } from '@/services/objection-engine';
import { ShinyText } from '@/components/react-bits/ShinyText';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

type TabType = 'diagnostic' | 'ai_pitch' | 'playbook';

export function LeadDrawer({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diagnostic');
  const [isReauditing, setIsReauditing] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedObjection, setCopiedObjection] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const playbook = useMemo(() => {
    if (!lead) return null;
    return generateSalesPlaybook(lead);
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleReAudit = async () => {
    setIsReauditing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/re-audit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao re-auditar');
      onLeadUpdated(data.lead);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao re-auditar website');
    } finally {
      setIsReauditing(false);
    }
  };

  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate-pitch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar pitch');
      onLeadUpdated(data.lead);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao gerar abordagem com IA');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!lead.ai_pitch) return;
    navigator.clipboard.writeText(lead.ai_pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleCopyReply = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedObjection(idx);
    setTimeout(() => setCopiedObjection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md transition-all">
      <div 
        className="w-full max-w-xl bg-[#0c0e14] border-l border-white/[0.08] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-250"
      >
        {/* Untitled UI Drawer Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#090b10] flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <ScoreRing score={lead.opportunity_score} size={46} strokeWidth={3.8} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider font-mono">
                  {lead.category || 'Empresa Local'}
                </span>
                {lead.site_status === 'offline_or_expired' && (
                  <span className="bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    Domínio Fora do Ar
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-snug mt-0.5">
                {lead.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1 font-sans">
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {lead.rating.toFixed(1)} ({lead.reviews_count} avaliações)
                </span>
                {lead.neighborhood && (
                  <span className="flex items-center gap-1 text-zinc-400 truncate max-w-[220px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    {lead.neighborhood}, {lead.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800/60 transition-all"
              title="Exportar Dossiê (PDF/Print)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800/60 transition-all"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Untitled UI Segmented Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-white/[0.08] bg-[#090b10]">
          <div className="flex bg-[#0f1219] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'diagnostic'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Raio-X Técnico</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_pitch')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai_pitch'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Abordagem IA</span>
            </button>

            <button
              onClick={() => setActiveTab('playbook')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'playbook'
                  ? 'bg-zinc-800 text-emerald-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              <span>Playbook Vendas</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 print:p-0">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: DIAGNÓSTICO TÉCNICO */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              {/* Gatilhos de Oportunidade */}
              <div className="bg-[#0f1219] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Gatilhos de Oportunidade
                  </h3>
                  <button
                    onClick={handleReAudit}
                    disabled={isReauditing}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReauditing ? 'animate-spin' : ''}`} />
                    <span>{isReauditing ? 'Auditando...' : 'Re-auditar'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.opportunity_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs px-2.5 py-1 rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid Técnico */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0f1219] p-3.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Website</span>
                  {lead.raw_website ? (
                    <a
                      href={lead.raw_website.startsWith('http') ? lead.raw_website : `http://${lead.raw_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 truncate font-mono text-xs mt-1 font-medium"
                    >
                      <span className="truncate">{lead.raw_website}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-rose-400 font-mono text-xs mt-1 block font-medium">Não possui website</span>
                  )}
                </div>

                <div className="bg-[#0f1219] p-3.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Status do Site</span>
                  <span className="text-zinc-200 font-medium text-xs mt-1 block">
                    {lead.site_status === 'offline_or_expired' && '⚠️ Fora do Ar'}
                    {lead.site_status === 'no_site' && 'Sem Site Cadastrado'}
                    {lead.site_status === 'social_only' && 'Rede Social / Linktree'}
                    {lead.site_status === 'online' && 'Online e Ativo'}
                  </span>
                </div>

                <div className="bg-[#0f1219] p-3.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Certificado SSL</span>
                  {lead.has_ssl ? (
                    <span className="text-emerald-400 font-medium text-xs flex items-center gap-1.5 mt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> HTTPS Seguro
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium text-xs flex items-center gap-1.5 mt-1">
                      <ShieldAlert className="w-4 h-4 text-rose-400" /> Inseguro (Sem SSL)
                    </span>
                  )}
                </div>

                <div className="bg-[#0f1219] p-3.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Mobile Viewport</span>
                  <span className={`font-medium text-xs mt-1 flex items-center gap-1.5 ${lead.is_responsive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Smartphone className="w-4 h-4" />
                    {lead.is_responsive ? 'Responsivo' : 'Não Otimizado'}
                  </span>
                </div>

                <div className="bg-[#0f1219] p-3.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">CMS / Stack</span>
                  <span className="text-zinc-200 font-medium text-xs mt-1 block truncate">
                    {lead.cms_or_stack || 'HTML / Custom'}
                  </span>
                </div>

                <div className="bg-[#0f1219] p-3.5 rounded-xl border border-white/[0.08]">
                  <span className="text-zinc-500 block text-[10px] uppercase font-mono tracking-wider">Tráfego Pago / Pixels</span>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${lead.has_meta_pixel ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-zinc-600'}`}>
                      Pixel: {lead.has_meta_pixel ? 'Sim' : 'Não'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${lead.has_google_tags ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-zinc-600'}`}>
                      GTM: {lead.has_google_tags ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linktree Unroller */}
              {lead.linktree_links && Object.keys(lead.linktree_links).length > 0 && (
                <div className="bg-[#0f1219] border border-white/[0.08] rounded-xl p-4 space-y-2">
                  <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block font-mono">
                    Links Desdobrados do Linktree:
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(lead.linktree_links).map(([title, url], idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#08090d] p-2 rounded-lg border border-white/[0.06] text-xs">
                        <span className="text-zinc-200 font-medium">{title}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 hover:underline truncate max-w-[200px] flex items-center gap-1"
                        >
                          <span className="truncate">{url}</span>
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contatos e Redes */}
              <div className="bg-[#0f1219] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block font-mono">
                  Contatos e Redes:
                </span>
                <div className="space-y-2 text-xs">
                  {lead.extracted_emails && lead.extracted_emails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lead.extracted_emails.map((e, idx) => (
                        <span key={idx} className="bg-[#08090d] border border-white/[0.08] px-2.5 py-1 rounded-lg text-zinc-300 font-mono text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                  {lead.social_links && Object.entries(lead.social_links).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(lead.social_links).map(([plat, url]) => (
                        <a
                          key={plat}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#08090d] border border-white/[0.08] px-3 py-1 rounded-lg text-zinc-300 hover:text-white hover:border-white/[0.2] text-xs font-medium capitalize flex items-center gap-1.5 transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                          {plat}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABORDAGEM IA */}
          {activeTab === 'ai_pitch' && (
            <div className="space-y-4">
              <div className="bg-[#0f1219] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <ShinyText 
                        text="Abordagem Comercial On-Demand"
                        className="text-xs font-bold uppercase tracking-wider text-white font-mono"
                        shimmerColor="rgba(245, 158, 11, 0.9)"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Gerado com Gemini 2.5 Flash • Contexto determinístico zero-token
                    </p>
                  </div>

                  <button
                    onClick={handleGeneratePitch}
                    disabled={isGeneratingPitch}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingPitch ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingPitch ? 'Gerando...' : lead.ai_pitch ? 'Regerar' : 'Gerar Pitch'}</span>
                  </button>
                </div>

                {lead.ai_pitch ? (
                  <div className="space-y-3">
                    <div className="bg-[#08090d] border border-white/[0.08] rounded-xl p-4 text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-sans select-text shadow-inner">
                      {lead.ai_pitch}
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={handleCopyPitch}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        {copiedPitch ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Copiado para a Área de Transferência!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-zinc-400" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>

                      {lead.whatsapp_link && (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(lead.ai_pitch)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Enviar via WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-500 font-sans text-xs">
                    <Sparkles className="w-8 h-8 text-amber-500/30 mx-auto mb-2" />
                    <p className="font-medium text-zinc-300">Nenhuma abordagem gerada ainda.</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Clique no botão acima para sintetizar os dados técnicos e gerar uma proposta personalizada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYBOOK DE OBJEÇÕES */}
          {activeTab === 'playbook' && playbook && (
            <div className="space-y-4">
              <div className="bg-[#0f1219] border border-white/[0.08] rounded-xl p-4 space-y-2">
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider block font-mono">
                  Gancho de Abertura Recomendado:
                </span>
                <p className="text-xs text-zinc-100 bg-[#08090d] p-3 rounded-lg border border-white/[0.06] font-sans leading-relaxed">
                  &quot;{playbook.immediateHook}&quot;
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block font-mono">
                  Matriz de Quebra de Objeções:
                </span>

                {playbook.objections.map((item, idx) => (
                  <div key={idx} className="bg-[#0f1219] border border-white/[0.08] rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-amber-300 font-semibold font-sans text-xs">
                      <span>🗣️ &quot;{item.objection}&quot;</span>
                      <button
                        onClick={() => handleCopyReply(item.recommendedReply, idx)}
                        className="text-zinc-400 hover:text-white text-[11px] font-medium flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-all active:scale-95"
                      >
                        {copiedObjection === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Resposta</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-zinc-400 bg-[#08090d] p-2.5 rounded-lg border border-white/[0.04]">
                      <strong className="text-zinc-300">Contexto:</strong> {item.contextWhy}
                    </div>

                    <div className="text-zinc-200 bg-[#141720] border border-white/[0.06] p-3 rounded-lg font-sans leading-relaxed text-xs">
                      {item.recommendedReply}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Untitled UI Drawer Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#090b10] flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono uppercase tracking-wider">Telefone Registrado</span>
            <span className="text-zinc-100 font-mono font-medium text-xs">{lead.phone || 'Sem telefone'}</span>
          </div>

          {lead.whatsapp_link && (
            <a
              href={lead.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir no WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
