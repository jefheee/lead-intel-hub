'use client';

import React, { useState } from 'react';
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
  Gauge, 
  Code2, 
  MapPin, 
  Phone
} from 'lucide-react';
import { Lead, CrmStage } from '@/types';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

export function LeadDrawer({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadDrawerProps) {
  const [isReauditing, setIsReauditing] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-xl bg-[#0b1324] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header do Drawer */}
        <div className="p-5 border-b border-slate-800 bg-[#090d16] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getScoreBadgeColor(lead.opportunity_score)}`}>
                Score: {lead.opportunity_score}/100
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                {lead.category || 'Empresa'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{lead.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {lead.rating.toFixed(1)} ({lead.reviews_count} avaliações)
              </span>
              {lead.neighborhood && (
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {lead.neighborhood}, {lead.city}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Oportunidades Identificadas */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Gatilhos de Oportunidade Comercial
            </h3>
            <div className="flex flex-wrap gap-2">
              {lead.opportunity_tags.length === 0 ? (
                <span className="text-xs text-slate-500">Nenhum gatilho crítico detectado.</span>
              ) : (
                lead.opportunity_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs px-2.5 py-1 rounded-md font-medium"
                  >
                    • {tag}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Raio-X Técnico do Website */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Diagnóstico Técnico (Zero-Token)
              </h3>
              <button
                onClick={handleReAudit}
                disabled={isReauditing}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                title="Executar novo crawler no website do lead"
              >
                <RefreshCw className={`w-3 h-3 ${isReauditing ? 'animate-spin' : ''}`} />
                <span>{isReauditing ? 'Auditando...' : 'Re-auditar'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Website URL</span>
                {lead.raw_website ? (
                  <a
                    href={lead.raw_website.startsWith('http') ? lead.raw_website : `http://${lead.raw_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-1 truncate font-mono text-[11px] mt-0.5"
                  >
                    <span className="truncate">{lead.raw_website}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-rose-400 font-semibold mt-0.5 block">Não possui site</span>
                )}
              </div>

              <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Classificação</span>
                <span className="text-slate-200 font-medium capitalize mt-0.5 block">
                  {lead.website_type === 'none' && 'Sem Site'}
                  {lead.website_type === 'social_or_linktree' && 'Linktree / Instagram'}
                  {lead.website_type === 'custom_domain' && 'Domínio Próprio'}
                </span>
              </div>

              <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Certificado SSL</span>
                {lead.website_type === 'custom_domain' ? (
                  lead.has_ssl ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> HTTPS Ativo
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Inseguro (Sem SSL)
                    </span>
                  )
                ) : (
                  <span className="text-slate-500 mt-0.5 block">N/A</span>
                )}
              </div>

              <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Mobile Friendly</span>
                <span className={`font-medium mt-0.5 flex items-center gap-1 ${lead.is_responsive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <Smartphone className="w-3.5 h-3.5" />
                  {lead.is_responsive ? 'Responsivo' : 'Viewport Ausente'}
                </span>
              </div>

              <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">CMS / Tecnologia</span>
                <span className="text-slate-200 font-mono text-[11px] mt-0.5 block">
                  {lead.cms_or_stack || 'Não identificado'}
                </span>
              </div>

              <div className="bg-[#090d16] p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Meta Pixel / Google Tags</span>
                <div className="flex gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lead.has_meta_pixel ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 bg-slate-900'}`}>
                    Pixel: {lead.has_meta_pixel ? 'Sim' : 'Não'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${lead.has_google_tags ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 bg-slate-900'}`}>
                    GTM: {lead.has_google_tags ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>

            {/* Emails e Redes Sociais */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">
                  E-mails Extraídos da Web:
                </span>
                {lead.extracted_emails && lead.extracted_emails.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {lead.extracted_emails.map((email, i) => (
                      <span key={i} className="bg-[#090d16] text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1">
                        <Mail className="w-3 h-3 text-sky-400" />
                        {email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-xs">Nenhum email institucional público encontrado.</span>
                )}
              </div>

              {lead.social_links && Object.keys(lead.social_links).length > 0 && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block mb-1">
                    Canais Sociais:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(lead.social_links).map(([key, link]) => (
                      <a
                        key={key}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-sky-300 text-xs flex items-center gap-1 bg-[#090d16] px-2 py-0.5 rounded border border-slate-800"
                      >
                        <Share2 className="w-3 h-3 text-slate-400" />
                        <span className="capitalize">{key}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Abordagem IA Sob Demanda */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Abordagem Comercial sob Demanda (AI Pitch)
              </h3>
              <button
                onClick={handleGeneratePitch}
                disabled={isGeneratingPitch}
                className="bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 px-3 py-1 rounded text-xs transition font-medium flex items-center gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingPitch ? 'animate-spin' : ''}`} />
                <span>{isGeneratingPitch ? 'Gerando...' : lead.ai_pitch ? 'Regerar Pitch' : 'Gerar Abordagem'}</span>
              </button>
            </div>

            {lead.ai_pitch ? (
              <div className="space-y-3">
                <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                  {lead.ai_pitch}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyPitch}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded text-xs transition flex items-center justify-center gap-1.5 font-medium"
                  >
                    {copiedPitch ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Mensagem</span>
                      </>
                    )}
                  </button>

                  {lead.whatsapp_link && (
                    <a
                      href={`${lead.whatsapp_link}?text=${encodeURIComponent(lead.ai_pitch)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded text-xs transition flex items-center justify-center gap-1.5 font-medium shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar no WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Clique no botão &quot;Gerar Abordagem&quot; para criar uma mensagem personalizada para este lead sem gastar tokens desnecessários.
              </p>
            )}
          </div>
        </div>

        {/* Rodapé com Telefone & WhatsApp */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-500 block text-[10px]">TELEFONE REGISTRADO</span>
            <span className="text-slate-200 font-mono font-medium">{lead.phone || 'Não informado'}</span>
          </div>

          {lead.whatsapp_link && (
            <a
              href={lead.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir Conversa Direta</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
