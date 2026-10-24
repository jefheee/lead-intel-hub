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
  Lightbulb
} from 'lucide-react';
import { Lead } from '@/types';
import { ScoreRing } from './ScoreRing';
import { generateSalesPlaybook } from '@/services/objection-engine';

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-[#111215] border-l border-white/[0.08] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header do Drawer */}
        <div className="p-4 border-b border-white/[0.08] bg-[#0d0e11] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ScoreRing score={lead.opportunity_score} size={42} strokeWidth={3.5} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#f59e0b] font-mono font-medium">
                  {lead.category || 'Empresa Local'}
                </span>
                {lead.site_status === 'offline_or_expired' && (
                  <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] px-1.5 py-0.5 rounded font-mono">
                    Domínio Fora do Ar
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#f4f4f6] tracking-tight leading-tight mt-0.5">
                {lead.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa] mt-1 font-mono">
                <span className="flex items-center gap-1 text-[#fbbf24] font-medium">
                  <Star className="w-3.5 h-3.5 fill-[#fbbf24]" />
                  {lead.rating.toFixed(1)} ({lead.reviews_count})
                </span>
                {lead.neighborhood && (
                  <span className="flex items-center gap-1 text-[#71717a] truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {lead.neighborhood}, {lead.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => window.print()}
              className="text-[#71717a] hover:text-[#f4f4f6] p-1.5 rounded hover:bg-[#1a1c21] transition"
              title="Exportar Dossiê (PDF/Print)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-[#71717a] hover:text-[#f4f4f6] p-1.5 rounded hover:bg-[#1a1c21] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-white/[0.08] bg-[#090a0c] px-3 text-xs font-mono">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'diagnostic'
                ? 'border-[#f59e0b] text-[#f59e0b]'
                : 'border-transparent text-[#71717a] hover:text-[#f4f4f6]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Raio-X Técnico</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_pitch')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'ai_pitch'
                ? 'border-[#f59e0b] text-[#f59e0b]'
                : 'border-transparent text-[#71717a] hover:text-[#f4f4f6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abordagem IA</span>
          </button>

          <button
            onClick={() => setActiveTab('playbook')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'playbook'
                ? 'border-[#f59e0b] text-[#f59e0b]'
                : 'border-transparent text-[#71717a] hover:text-[#f4f4f6]'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Playbook Objeções</span>
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 print:p-0">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded">
              {errorMsg}
            </div>
          )}

          {/* ABA 1: DIAGNÓSTICO TÉCNICO */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-3">
              <div className="bg-[#16171b] border border-white/[0.07] rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">
                    Gatilhos de Oportunidade
                  </h3>
                  <button
                    onClick={handleReAudit}
                    disabled={isReauditing}
                    className="text-[11px] text-[#f59e0b] hover:text-amber-400 font-mono flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isReauditing ? 'animate-spin' : ''}`} />
                    <span>{isReauditing ? 'Auditando...' : 'Re-auditar'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lead.opportunity_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#24262c] text-[#fbbf24] border border-white/[0.08] text-[11px] px-2 py-0.5 rounded font-mono"
                    >
                      • {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid Técnico */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-[#0e0f12] p-2.5 rounded border border-white/[0.07]">
                  <span className="text-[#71717a] block text-[9px] uppercase font-mono">Website</span>
                  {lead.raw_website ? (
                    <a
                      href={lead.raw_website.startsWith('http') ? lead.raw_website : `http://${lead.raw_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#f59e0b] hover:underline flex items-center gap-1 truncate font-mono text-[11px] mt-0.5"
                    >
                      <span className="truncate">{lead.raw_website}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-rose-400 font-mono text-[11px] mt-0.5 block">Não possui</span>
                  )}
                </div>

                <div className="bg-[#0e0f12] p-2.5 rounded border border-white/[0.07]">
                  <span className="text-[#71717a] block text-[9px] uppercase font-mono">Status do Site</span>
                  <span className="text-[#f4f4f6] font-mono text-[11px] mt-0.5 block">
                    {lead.site_status === 'offline_or_expired' && '⚠️ Fora do Ar'}
                    {lead.site_status === 'no_site' && 'Sem Site'}
                    {lead.site_status === 'social_only' && 'Rede / Linktree'}
                    {lead.site_status === 'online' && 'Online'}
                  </span>
                </div>

                <div className="bg-[#0e0f12] p-2.5 rounded border border-white/[0.07]">
                  <span className="text-[#71717a] block text-[9px] uppercase font-mono">Certificado SSL</span>
                  {lead.has_ssl ? (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> HTTPS Ativo
                    </span>
                  ) : (
                    <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Inseguro (Sem SSL)
                    </span>
                  )}
                </div>

                <div className="bg-[#0e0f12] p-2.5 rounded border border-white/[0.07]">
                  <span className="text-[#71717a] block text-[9px] uppercase font-mono">Mobile Viewport</span>
                  <span className={`font-mono text-[11px] mt-0.5 flex items-center gap-1 ${lead.is_responsive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Smartphone className="w-3.5 h-3.5" />
                    {lead.is_responsive ? 'Responsivo' : 'Sem Viewport'}
                  </span>
                </div>

                <div className="bg-[#0e0f12] p-2.5 rounded border border-white/[0.07]">
                  <span className="text-[#71717a] block text-[9px] uppercase font-mono">CMS / Stack</span>
                  <span className="text-[#f4f4f6] font-mono text-[11px] mt-0.5 block truncate">
                    {lead.cms_or_stack || 'HTML / Custom'}
                  </span>
                </div>

                <div className="bg-[#0e0f12] p-2.5 rounded border border-white/[0.07]">
                  <span className="text-[#71717a] block text-[9px] uppercase font-mono">Tráfego Pago</span>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lead.has_meta_pixel ? 'bg-[#27272a] text-[#f4f4f6]' : 'text-[#52525b]'}`}>
                      Pixel: {lead.has_meta_pixel ? 'Sim' : 'Não'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lead.has_google_tags ? 'bg-[#27272a] text-[#f4f4f6]' : 'text-[#52525b]'}`}>
                      GTM: {lead.has_google_tags ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linktree Unroller */}
              {lead.linktree_links && Object.keys(lead.linktree_links).length > 0 && (
                <div className="bg-[#16171b] border border-white/[0.07] rounded-lg p-3 space-y-1.5">
                  <span className="text-[#71717a] text-[10px] font-mono uppercase tracking-wider block">
                    Links Desdobrados do Linktree:
                  </span>
                  <div className="space-y-1">
                    {Object.entries(lead.linktree_links).map(([title, url], idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#0e0f12] p-1.5 rounded border border-white/[0.05] text-[11px] font-mono">
                        <span className="text-[#d4d4d8]">{title}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#f59e0b] hover:underline truncate max-w-[180px]"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contatos */}
              <div className="bg-[#16171b] border border-white/[0.07] rounded-lg p-3 space-y-2">
                <span className="text-[#71717a] text-[10px] font-mono uppercase tracking-wider block">
                  Contatos e Redes:
                </span>
                <div className="space-y-1.5 text-xs">
                  {lead.extracted_emails && lead.extracted_emails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lead.extracted_emails.map((e, idx) => (
                        <span key={idx} className="bg-[#0e0f12] border border-white/[0.07] px-2 py-0.5 rounded text-[#d4d4d8] font-mono text-[10px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#a1a1aa]" />
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                  {lead.social_links && Object.entries(lead.social_links).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {Object.entries(lead.social_links).map(([plat, url]) => (
                        <a
                          key={plat}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#0e0f12] border border-white/[0.07] px-2 py-0.5 rounded text-[#a1a1aa] hover:text-[#f4f4f6] text-[11px] font-mono capitalize flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3 text-[#71717a]" />
                          {plat}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: PITCH ON-DEMAND */}
          {activeTab === 'ai_pitch' && (
            <div className="space-y-3">
              <div className="bg-[#16171b] border border-white/[0.07] rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#f4f4f6]">
                      Abordagem Comercial sob Demanda
                    </h3>
                    <p className="text-[10px] text-[#71717a] font-mono">
                      Gemini 2.5 Flash • Zero tokens prévios gastos
                    </p>
                  </div>

                  <button
                    onClick={handleGeneratePitch}
                    disabled={isGeneratingPitch}
                    className="bg-[#d97706]/20 hover:bg-[#d97706]/30 text-[#fbbf24] border border-[#f59e0b]/40 px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingPitch ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingPitch ? 'Gerando...' : lead.ai_pitch ? 'Regerar' : 'Gerar'}</span>
                  </button>
                </div>

                {lead.ai_pitch ? (
                  <div className="space-y-2.5">
                    <div className="bg-[#0e0f12] border border-white/[0.07] rounded p-3 text-xs text-[#d4d4d8] leading-relaxed whitespace-pre-line font-sans select-text">
                      {lead.ai_pitch}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyPitch}
                        className="flex-1 bg-[#222429] hover:bg-[#2c2e35] text-[#f4f4f6] px-3 py-1.5 rounded text-xs font-mono transition flex items-center justify-center gap-1.5"
                      >
                        {copiedPitch ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#a1a1aa]" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>

                      {lead.whatsapp_link && (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(lead.ai_pitch)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#059669] hover:bg-[#10b981] text-white px-3 py-1.5 rounded text-xs font-mono transition flex items-center justify-center gap-1.5 font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-[#71717a] font-mono text-xs">
                    <Sparkles className="w-5 h-5 text-[#52525b] mx-auto mb-1.5" />
                    <p>Nenhuma abordagem gerada ainda.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: PLAYBOOK DE OBJEÇÕES */}
          {activeTab === 'playbook' && playbook && (
            <div className="space-y-3">
              <div className="bg-[#16171b] border border-white/[0.07] rounded-lg p-3 space-y-1.5">
                <span className="text-[#10b981] text-[10px] font-mono uppercase tracking-wider block">
                  Gancho de Abertura Recomendado:
                </span>
                <p className="text-xs text-[#e4e4e7] bg-[#0e0f12] p-2.5 rounded border border-white/[0.06] font-sans leading-relaxed">
                  &quot;{playbook.immediateHook}&quot;
                </p>
              </div>

              <div className="space-y-2.5">
                <span className="text-[#71717a] text-[10px] font-mono uppercase tracking-wider block">
                  Matriz de Quebra de Objeções:
                </span>

                {playbook.objections.map((item, idx) => (
                  <div key={idx} className="bg-[#16171b] border border-white/[0.07] rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#fbbf24] font-medium font-mono text-[11px]">
                      <span>🗣️ &quot;{item.objection}&quot;</span>
                      <button
                        onClick={() => handleCopyReply(item.recommendedReply, idx)}
                        className="text-[#a1a1aa] hover:text-[#f4f4f6] text-[10px] font-mono flex items-center gap-1 bg-[#222429] px-1.5 py-0.5 rounded transition"
                      >
                        {copiedObjection === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[10px] text-[#71717a] bg-[#0e0f12] p-2 rounded border border-white/[0.04] font-mono">
                      {item.contextWhy}
                    </div>

                    <div className="text-[#e4e4e7] bg-[#1a1c22] border border-white/[0.08] p-2.5 rounded font-sans leading-relaxed text-xs">
                      {item.recommendedReply}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0d0e11] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#71717a] block text-[9px] font-mono">TELEFONE REGISTRADO</span>
            <span className="text-[#f4f4f6] font-mono font-medium">{lead.phone || 'Sem telefone'}</span>
          </div>

          {lead.whatsapp_link && (
            <a
              href={lead.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#059669] hover:bg-[#10b981] text-white font-mono font-medium px-3.5 py-1.5 rounded text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Direto</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
