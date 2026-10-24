import { WebsiteType, SiteStatus } from '@/types';

export interface ScoringInput {
  rating: number;
  reviews_count: number;
  website_type: WebsiteType;
  site_status?: SiteStatus;
  has_ssl: boolean;
  is_responsive: boolean;
  cms_or_stack: string | null;
  has_meta_pixel: boolean;
  has_google_tags: boolean;
  pagespeed_mobile_score: number | null;
  whatsapp_link: string | null;
  phone: string | null;
}

export interface ScoringResult {
  score: number;
  tags: string[];
}

export function calculateOpportunityScore(input: ScoringInput): ScoringResult {
  let score = 0;
  const tags: string[] = [];

  // Regra 1: Negócio ativo com alta prova social (> 30 avaliações e nota >= 4.2)
  if (input.reviews_count >= 30 && input.rating >= 4.2) {
    score += 25;
    tags.push('Alta Prova Social');
  }

  // Regra 2: Site Fora do Ar ou Domínio Expirado (Oportunidade Crítica!)
  if (input.site_status === 'offline_or_expired') {
    score += 45;
    tags.push('Site Fora do Ar / Domínio Expirado');
  } else if (input.website_type === 'none') {
    score += 45;
    tags.push('Sem Site');
  } else if (input.website_type === 'social_or_linktree' || input.site_status === 'social_only') {
    score += 45;
    tags.push('Apenas Redes / Linktree');
  }

  // Regra 3: Domínio próprio com falhas críticas (Sem SSL ou Não responsivo) (+40 pts)
  if (input.website_type === 'custom_domain' && input.site_status === 'online') {
    const isUnsafe = !input.has_ssl;
    const isNotMobileFriendly = !input.is_responsive;

    if (isUnsafe || isNotMobileFriendly) {
      score += 40;
      if (isUnsafe && isNotMobileFriendly) {
        tags.push('Sem SSL & Não Responsivo');
      } else if (isUnsafe) {
        tags.push('Sem SSL');
      } else {
        tags.push('Não Responsivo');
      }
    }
  }

  // Regra 4: Tráfego pago ativo (Pixel ou GTM/Google Ads) mas lento ou WordPress pesado (+35 pts)
  if (input.website_type === 'custom_domain') {
    const isRunningAds = input.has_meta_pixel || input.has_google_tags;
    const isSlowOrHeavy =
      (input.pagespeed_mobile_score !== null && input.pagespeed_mobile_score < 50) ||
      (input.cms_or_stack && /wordpress|wix/i.test(input.cms_or_stack));

    if (isRunningAds && isSlowOrHeavy) {
      score += 35;
      tags.push('Anuncia c/ Site Lento/Pesado');
    } else if (isRunningAds) {
      tags.push('Investe em Tráfego');
    }
  }

  // Regra 5: Possui WhatsApp / Celular direto (+15 pts)
  if (input.whatsapp_link) {
    score += 15;
    tags.push('WhatsApp Direto');
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    tags,
  };
}
