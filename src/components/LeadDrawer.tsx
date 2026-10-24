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
  FileText, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { Lead, CrmStage } from '@/types';
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

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-[#0b1324] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header do Drawer */}
        <div className="p-5 border-b border-slate-800 bg-[#090d16] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ScoreRing score={lead.opportunity_score} size={48} strokeWidth={4} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-400 font-mono font-medium">
                  {lead.category || 'Empresa Local'}
                </span>
                {lead.site_status === 'offline_or_expired' && (
                  <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium">
                    Domínio Fora do Ar
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-tight mt-0.5">
                {lead.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {lead.rating.toFixed(1)} ({lead.reviews_count} avaliações)
                </span>
                {lead.neighborhood && (
                  <span className="flex items-center gap-1 text-slate-400 truncate max-w-[220px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {lead.neighborhood}, {lead.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrintDossier}
              className="text-slate-400 hover:text-sky-300 p-2 rounded-lg hover:bg-slate-800 transition"
              title="Exportar Dossiê de Auditoria (Imprimir / Salvar PDF)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas Superiores */}
        <div className="flex border-b border-slate-800 bg-[#070b14] px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'diagnostic'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Raio-X Técnico</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_pitch')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'ai_pitch'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Abordagem IA (Pitch)</span>
          </button>

          <button
            onClick={() => setActiveTab('playbook')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'playbook'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Playbook de Objeções</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 print:p-0">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* ABA 1: DIAGNÓSTICO TÉCNICO & AUDITORIA */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              {/* Oportunidades Identificadas */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Oportunidades Comerciais Críticas
                  </h3>
                  <button
                    onClick={handleReAudit}
                    disabled={isReauditing}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isReauditing ? 'animate-spin' : ''}`} />
                    <span>{isReauditing ? 'Auditando...' : 'Re-auditar'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.opportunity_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs px-2.5 py-1 rounded-md font-medium"
                    >
                      • {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid de Diagnóstico */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Website</span>
                  {lead.raw_website ? (
                    <a
                      href={lead.raw_website.startsWith('http') ? lead.raw_website : `http://${lead.raw_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 truncate font-mono text-[11px] mt-1"
                    >
                      <span className="truncate">{lead.raw_website}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-rose-400 font-semibold mt-1 block">Não possui site</span>
                  )}
                </div>

                <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Status do Site</span>
                  <span className="text-slate-200 font-medium capitalize mt-1 block">
                    {lead.site_status === 'offline_or_expired' && '⚠️ Domínio Fora do Ar'}
                    {lead.site_status === 'no_site' && 'Sem Site Cadastrado'}
                    {lead.site_status === 'social_only' && 'Rede Social / Linktree'}
                    {lead.site_status === 'online' && 'Online'}
                  </span>
                </div>

                <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Certificado SSL</span>
                  {lead.has_ssl ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> HTTPS Ativo
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium flex items-center gap-1 mt-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Inseguro (Sem SSL)
                    </span>
                  )}
                </div>

                <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Responsividade Mobile</span>
                  <span className={`font-medium mt-1 flex items-center gap-1 ${lead.is_responsive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <Smartphone className="w-3.5 h-3.5" />
                    {lead.is_responsive ? 'Viewport Adequado' : 'Não Responsivo'}
                  </span>
                </div>

                <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">CMS / Plataforma</span>
                  <span className="text-slate-200 font-mono text-[11px] mt-1 block truncate">
                    {lead.cms_or_stack || 'HTML / Custom'}
                  </span>
                </div>

                <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Tráfego Pago (Ads)</span>
                  <div className="flex gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lead.has_meta_pixel ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 bg-slate-900'}`}>
                      Pixel: {lead.has_meta_pixel ? 'Sim' : 'Não'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lead.has_google_tags ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 bg-slate-900'}`}>
                      GTM: {lead.has_google_tags ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linktree Unroller Links */}
              {lead.linktree_links && Object.keys(lead.linktree_links).length > 0 && (
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                    Links Desdobrados do Linktree / Agregador:
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(lead.linktree_links).map(([title, url], idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#090d16] p-2 rounded-lg border border-slate-800 text-xs">
                        <span className="font-medium text-slate-300">{title}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline text-[11px] font-mono truncate max-w-[200px]"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contatos Extraídos */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                  Contatos e Redes Identificadas:
                </span>
                <div className="space-y-1.5 text-xs">
                  {lead.extracted_emails && lead.extracted_emails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lead.extracted_emails.map((e, idx) => (
                        <span key={idx} className="bg-[#090d16] border border-slate-800 px-2 py-1 rounded text-slate-300 font-mono text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-sky-400" />
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
                          className="bg-[#090d16] border border-slate-800 px-2.5 py-1 rounded text-slate-300 hover:text-sky-300 text-xs capitalize flex items-center gap-1.5"
                        >
                          <Share2 className="w-3 h-3 text-slate-500" />
                          {plat}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: ABORDAGEM IA (PITCH ON-DEMAND) */}
          {activeTab === 'ai_pitch' && (
            <div className="space-y-4">
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Abordagem Comercial sob Demanda (AI Pitch)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Zero gasto prévio de tokens. Gerado exclusivamente sob demanda via Gemini 2.5 Flash.
                    </p>
                  </div>

                  <button
                    onClick={handleGeneratePitch}
                    disabled={isGeneratingPitch}
                    className="bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs transition font-medium flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingPitch ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingPitch ? 'Gerando...' : lead.ai_pitch ? 'Regerar' : 'Gerar Abordagem'}</span>
                  </button>
                </div>

                {lead.ai_pitch ? (
                  <div className="space-y-3">
                    <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans select-text">
                      {lead.ai_pitch}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyPitch}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 font-medium"
                      >
                        {copiedPitch ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>

                      {lead.whatsapp_link && (
                        <a
                          href={`${lead.whatsapp_link}?text=${encodeURIComponent(lead.ai_pitch)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 font-medium shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p>Nenhuma abordagem gerada ainda para este lead.</p>
                    <p className="mt-1">Clique no botão acima para sintetizar o dossiê técnico em uma mensagem de alto impacto.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: PLAYBOOK DE VENDAS & QUEBRA DE OBJEÇÕES */}
          {activeTab === 'playbook' && playbook && (
            <div className="space-y-4">
              {/* Gancho Imediato */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider block">
                  Gancho de Abertura Recomendado:
                </span>
                <p className="text-xs text-slate-200 bg-[#090d16] p-3 rounded-lg border border-slate-800 font-sans leading-relaxed">
                  &quot;{playbook.immediateHook}&quot;
                </p>
              </div>

              {/* Matriz de Objeções Reais */}
              <div className="space-y-3">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                  Matriz de Quebra de Objeções (Inspirado no Sales Team Claude):
                </span>

                {playbook.objections.map((item, idx) => (
                  <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-amber-300 font-semibold">
                      <span>🗣️ Objeção: &quot;{item.objection}&quot;</span>
                      <button
                        onClick={() => handleCopyReply(item.recommendedReply, idx)}
                        className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 transition"
                      >
                        {copiedObjection === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar Resposta</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 bg-[#090d16] p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-mono uppercase text-[9px] block mb-0.5">Por trás da objeção:</span>
                      {item.contextWhy}
                    </div>

                    <div className="text-slate-200 bg-sky-950/20 border border-sky-500/30 p-3 rounded-lg font-sans leading-relaxed">
                      <span className="text-sky-400 font-mono uppercase text-[9px] block mb-1">Como Responder:</span>
                      {item.recommendedReply}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16] flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">TELEFONE DO ESTABELECIMENTO</span>
            <span className="text-slate-200 font-mono font-medium">{lead.phone || 'Sem telefone'}</span>
          </div>

          {lead.whatsapp_link && (
            <a
              href={lead.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direto</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
