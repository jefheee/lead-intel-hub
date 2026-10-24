import * as cheerio from 'cheerio';
import { WebsiteType, AuditStatus, SiteStatus } from '@/types';

export interface AuditResult {
  website_type: WebsiteType;
  site_status: SiteStatus;
  audit_status: AuditStatus;
  has_ssl: boolean;
  is_responsive: boolean;
  cms_or_stack: string | null;
  has_meta_pixel: boolean;
  has_google_tags: boolean;
  extracted_emails: string[];
  social_links: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
  linktree_links: Record<string, string>;
  pagespeed_mobile_score: number | null;
  discovered_whatsapp?: string | null;
}

const SOCIAL_OR_AGGREGATOR_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'fb.me',
  'wa.me',
  'whatsapp.com',
  'linktr.ee',
  'linktree.com',
  'bio.link',
  'bio.site',
  'beacons.ai',
  'instabio.cc',
  'ifood.com.br',
  'tiktok.com',
  'youtube.com',
  'bit.ly',
];

const LINKTREE_AGGREGATORS = ['linktr.ee', 'linktree.com', 'bio.link', 'bio.site', 'beacons.ai', 'instabio.cc'];

const JUNK_EMAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js'];
const JUNK_EMAIL_DOMAINS = [
  'example.com',
  'sentry.io',
  'wixpress.com',
  'wix.com',
  'godaddy.com',
  'squarespace.com',
  'wordpress.org',
  'domain.com',
  'email.com',
  'schema.org',
  'w3.org',
];

/**
 * 1. Classificador de URL: none, social_or_linktree ou custom_domain
 */
export function classifyWebsite(rawUrl: string | null | undefined): WebsiteType {
  if (!rawUrl || !rawUrl.trim()) {
    return 'none';
  }

  const clean = rawUrl.trim().toLowerCase();
  for (const domain of SOCIAL_OR_AGGREGATOR_DOMAINS) {
    if (clean.includes(domain)) {
      return 'social_or_linktree';
    }
  }

  return 'custom_domain';
}

/**
 * 2. Normalizador de Telefone Brasileiro com geração de link WhatsApp
 */
export function normalizeBrazilianPhone(rawPhone: string | null | undefined): {
  phone: string | null;
  whatsapp_link: string | null;
  is_mobile: boolean;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { phone: null, whatsapp_link: null, is_mobile: false };
  }

  // Remove caracteres não numéricos
  let digits = rawPhone.replace(/\D/g, '');

  // Trata prefixo do Brasil (55) se vier incluído
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // Remove zero à esquerda do DDD caso exista (ex: 048 -> 48)
  if (digits.startsWith('0') && digits.length >= 11) {
    digits = digits.slice(1);
  }

  // Número padrão Brasil: DDD (2 dígitos) + 8 dígitos (fixo) ou 9 dígitos (celular)
  if (digits.length < 10 || digits.length > 11) {
    return {
      phone: rawPhone.trim(),
      whatsapp_link: null,
      is_mobile: false,
    };
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  const isMobile = number.length === 9 && number.startsWith('9');

  const formatted = isMobile
    ? `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
    : `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;

  const whatsappLink = `https://wa.me/55${ddd}${number}`;

  return {
    phone: formatted,
    whatsapp_link: whatsappLink,
    is_mobile: isMobile,
  };
}

/**
 * Crawler Leve com AbortController (8s) e Resiliência de Rede
 */
async function fetchHtmlWithTimeout(
  url: string,
  timeoutMs = 8000
): Promise<{ html: string; finalUrl: string; hasSsl: boolean; isDown: boolean }> {
  let targetUrl = url;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 LeadIntelHub/2.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    if (!res.ok && res.status >= 500) {
      return { html: '', finalUrl: targetUrl, hasSsl: targetUrl.startsWith('https://'), isDown: true };
    }

    const html = await res.text();
    const finalUrl = res.url || targetUrl;
    const hasSsl = finalUrl.startsWith('https://');

    return { html, finalUrl, hasSsl, isDown: false };
  } catch (error) {
    clearTimeout(timeoutId);

    // Fallback: Se falhou com HTTPS (ex: certificado quebrado), tenta HTTP
    if (targetUrl.startsWith('https://')) {
      const fallbackUrl = targetUrl.replace('https://', 'http://');
      const fallbackCtrl = new AbortController();
      const fbTimeout = setTimeout(() => fallbackCtrl.abort(), timeoutMs);

      try {
        const resFallback = await fetch(fallbackUrl, {
          signal: fallbackCtrl.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 LeadIntelHub/2.0',
          },
        });
        clearTimeout(fbTimeout);
        const html = await resFallback.text();
        return { html, finalUrl: resFallback.url || fallbackUrl, hasSsl: false, isDown: false };
      } catch {
        clearTimeout(fbTimeout);
      }
    }

    // Domínio falhou por DNS, timeout ou conexão recusada
    return { html: '', finalUrl: targetUrl, hasSsl: false, isDown: true };
  }
}

/**
 * Linktree & Bio Aggregator Unroller (Inspirado no projeto Scout)
 * Extrai links reais, WhatsApp e redes contidas no agregador
 */
async function unrollLinktree(url: string): Promise<{
  discoveredWhatsapp: string | null;
  linktreeLinks: Record<string, string>;
  discoveredSocials: Record<string, string>;
}> {
  const result: {
    discoveredWhatsapp: string | null;
    linktreeLinks: Record<string, string>;
    discoveredSocials: Record<string, string>;
  } = {
    discoveredWhatsapp: null,
    linktreeLinks: {},
    discoveredSocials: {},
  };

  try {
    const { html, isDown } = await fetchHtmlWithTimeout(url, 6000);
    if (isDown || !html) return result;

    const $ = cheerio.load(html);

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim() || 'Link';

      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      // Detecta WhatsApp
      if (href.includes('wa.me/') || href.includes('api.whatsapp.com/')) {
        const matchDigits = href.match(/\d{10,14}/);
        if (matchDigits) {
          result.discoveredWhatsapp = `https://wa.me/${matchDigits[0]}`;
        }
        result.linktreeLinks['WhatsApp'] = href;
      }
      // Detecta Instagram
      else if (href.includes('instagram.com/')) {
        result.discoveredSocials.instagram = href;
        result.linktreeLinks['Instagram'] = href;
      }
      // Detecta Facebook
      else if (href.includes('facebook.com/')) {
        result.discoveredSocials.facebook = href;
        result.linktreeLinks['Facebook'] = href;
      }
      // Outros links de interesse comercial
      else if (href.startsWith('http')) {
        const key = text.slice(0, 30) || `Link_${Object.keys(result.linktreeLinks).length + 1}`;
        result.linktreeLinks[key] = href;
      }
    });

    return result;
  } catch {
    return result;
  }
}

/**
 * 3. Auditoria Técnica Completa do Website
 */
export async function auditWebsite(
  rawWebsite: string | null | undefined,
  options?: { skipPageSpeed?: boolean }
): Promise<AuditResult> {
  const type = classifyWebsite(rawWebsite);

  if (type === 'none') {
    return {
      website_type: 'none',
      site_status: 'no_site',
      audit_status: 'completed',
      has_ssl: false,
      is_responsive: false,
      cms_or_stack: null,
      has_meta_pixel: false,
      has_google_tags: false,
      extracted_emails: [],
      social_links: {},
      linktree_links: {},
      pagespeed_mobile_score: null,
    };
  }

  // Agregadores sociais ou Linktree
  if (type === 'social_or_linktree') {
    let discoveredWhatsapp: string | null = null;
    let linktreeLinks: Record<string, string> = {};
    const social_links: Record<string, string> = rawWebsite ? { link: rawWebsite } : {};

    const clean = (rawWebsite || '').toLowerCase();
    const isAggregator = LINKTREE_AGGREGATORS.some((agg) => clean.includes(agg));

    if (isAggregator && rawWebsite) {
      const unrolled = await unrollLinktree(rawWebsite);
      discoveredWhatsapp = unrolled.discoveredWhatsapp;
      linktreeLinks = unrolled.linktreeLinks;
      Object.assign(social_links, unrolled.discoveredSocials);
    }

    return {
      website_type: 'social_or_linktree',
      site_status: 'social_only',
      audit_status: 'completed',
      has_ssl: true,
      is_responsive: true,
      cms_or_stack: isAggregator ? 'Linktree / Bio Aggregator' : 'Social Media Profile',
      has_meta_pixel: false,
      has_google_tags: false,
      extracted_emails: [],
      social_links,
      linktree_links: linktreeLinks,
      pagespeed_mobile_score: null,
      discovered_whatsapp: discoveredWhatsapp,
    };
  }

  // Domínio próprio (custom_domain)
  try {
    const { html, hasSsl, finalUrl, isDown } = await fetchHtmlWithTimeout(rawWebsite!);

    // Caso o site esteja fora do ar ou o domínio tenha expirado (DNS fail, timeout)
    if (isDown || !html) {
      return {
        website_type: 'custom_domain',
        site_status: 'offline_or_expired',
        audit_status: 'completed',
        has_ssl: false,
        is_responsive: false,
        cms_or_stack: 'Domínio Fora do Ar',
        has_meta_pixel: false,
        has_google_tags: false,
        extracted_emails: [],
        social_links: {},
        linktree_links: {},
        pagespeed_mobile_score: null,
      };
    }

    const $ = cheerio.load(html);

    // Responsividade
    const viewportMeta = $('meta[name="viewport"]').attr('content') || '';
    const isResponsive = /width=device-width/i.test(viewportMeta);

    // Assinaturas de Código (Tracking)
    const rawLower = html.toLowerCase();
    const hasMetaPixel =
      rawLower.includes('fbq(') ||
      rawLower.includes('connect.facebook.net') ||
      rawLower.includes('fbevents.js');

    const hasGoogleTags =
      rawLower.includes('gtag(') ||
      rawLower.includes('googletagmanager.com/gtm.js') ||
      rawLower.includes('google-analytics.com/analytics.js') ||
      /gtm-[a-z0-9]+/i.test(html);

    // Detecção de CMS / Stack
    const stacks: string[] = [];
    if (rawLower.includes('wp-content') || rawLower.includes('wp-includes')) {
      stacks.push('WordPress');
    }
    if (rawLower.includes('wix.com') || rawLower.includes('_wix_')) {
      stacks.push('Wix');
    }
    if (rawLower.includes('_next') || rawLower.includes('__next')) {
      stacks.push('Next.js');
    }
    if (rawLower.includes('cdn.shopify.com')) {
      stacks.push('Shopify');
    }
    if (rawLower.includes('static1.squarespace.com')) {
      stacks.push('Squarespace');
    }
    if (rawLower.includes('webflow.com') || rawLower.includes('data-wf-page')) {
      stacks.push('Webflow');
    }
    if (rawLower.includes('rdstation') || rawLower.includes('d335luupugsy2')) {
      stacks.push('RD Station');
    }

    const cms_or_stack = stacks.length > 0 ? stacks.join(', ') : 'HTML / Custom';

    // Extração de Emails
    const emailMatches = new Set<string>();
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (isValidEmail(email)) {
        emailMatches.add(email);
      }
    });

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyText = $('body').text();
    const foundRegexEmails = bodyText.match(emailRegex) || [];
    for (const e of foundRegexEmails) {
      const email = e.trim().toLowerCase();
      if (isValidEmail(email)) {
        emailMatches.add(email);
      }
    }

    // Links Sociais
    const social_links: Record<string, string> = {};
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (/instagram\.com\/[a-zA-Z0-9_.]+/i.test(href) && !social_links.instagram) {
        if (!href.includes('/p/') && !href.includes('/reel/')) {
          social_links.instagram = href;
        }
      }
      if (/facebook\.com\/[a-zA-Z0-9_.-]+/i.test(href) && !social_links.facebook) {
        if (!href.includes('/sharer')) {
          social_links.facebook = href;
        }
      }
      if (/linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_.-]+/i.test(href) && !social_links.linkedin) {
        social_links.linkedin = href;
      }
    });

    // PageSpeed Mobile Score
    let pagespeed_mobile_score: number | null = null;
    if (!options?.skipPageSpeed && (process.env.PAGESPEED_API_KEY || process.env.NODE_ENV !== 'test')) {
      try {
        pagespeed_mobile_score = await fetchPageSpeedScore(finalUrl);
      } catch {
        pagespeed_mobile_score = null;
      }
    }

    return {
      website_type: 'custom_domain',
      site_status: 'online',
      audit_status: 'completed',
      has_ssl: hasSsl,
      is_responsive: isResponsive,
      cms_or_stack,
      has_meta_pixel: hasMetaPixel,
      has_google_tags: hasGoogleTags,
      extracted_emails: Array.from(emailMatches).slice(0, 5),
      social_links,
      linktree_links: {},
      pagespeed_mobile_score,
    };
  } catch {
    return {
      website_type: 'custom_domain',
      site_status: 'offline_or_expired',
      audit_status: 'failed',
      has_ssl: false,
      is_responsive: false,
      cms_or_stack: null,
      has_meta_pixel: false,
      has_google_tags: false,
      extracted_emails: [],
      social_links: {},
      linktree_links: {},
      pagespeed_mobile_score: null,
    };
  }
}

function isValidEmail(email: string): boolean {
  if (!email || email.length < 5) return false;
  if (JUNK_EMAIL_EXTENSIONS.some((ext) => email.endsWith(ext))) return false;
  if (JUNK_EMAIL_DOMAINS.some((domain) => email.includes(domain))) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * PageSpeed Insights API (Mobile)
 */
export async function fetchPageSpeedScore(targetUrl: string): Promise<number | null> {
  const apiKey = process.env.PAGESPEED_API_KEY || '';
  const urlParam = encodeURIComponent(targetUrl);
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${urlParam}&strategy=mobile${
    apiKey ? `&key=${apiKey}` : ''
  }`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const score = data?.lighthouseResult?.categories?.performance?.score;
    if (typeof score === 'number') {
      return Math.round(score * 100);
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
