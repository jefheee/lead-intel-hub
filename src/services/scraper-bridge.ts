import { ScrapeRequestParams, ScraperHealthStatus, ScrapingJob, Lead } from '@/types';
import { auditWebsite, normalizeBrazilianPhone } from './website-auditor';
import { calculateOpportunityScore } from './scoring-engine';
import { createJob, updateJob, upsertLead } from '@/lib/db';
import { ensureScraperRunning } from './docker-manager';

const BASE_URL = process.env.SCRAPER_BASE_URL || `http://localhost:${process.env.SCRAPER_PORT || '8080'}`;
const API_KEY = process.env.SCRAPER_API_KEY || '';
const USER_AGENT = 'lead-intel-hub/2.0 (https://github.com/Mahanaicoach/google-maps-scraper-kit)';

export async function checkScraperHealth(): Promise<ScraperHealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const headers: Record<string, string> = { 'User-Agent': USER_AGENT };
    if (API_KEY) headers['X-API-Key'] = API_KEY;

    const res = await fetch(`${BASE_URL}/api/v1/jobs`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return { online: true, url: BASE_URL };
    }
    return { online: false, url: BASE_URL, error: `HTTP ${res.status}` };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      online: false,
      url: BASE_URL,
      error: error instanceof Error ? error.message : 'Conexão recusada',
    };
  }
}

export async function geocodeLocation(location: string): Promise<{ lat: string; lon: string } | null> {
  try {
    const q = encodeURIComponent(location);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) return null;
    const hits = await res.json();
    if (Array.isArray(hits) && hits.length > 0) {
      return {
        lat: String(hits[0].lat),
        lon: String(hits[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.warn(`Geocoding failed for ${location}:`, error);
    return null;
  }
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function triggerScrapingPipeline(
  params: ScrapeRequestParams,
  onTelemetry?: (step: number, total: number, message: string) => void
): Promise<{
  job: ScrapingJob;
  leads: Lead[];
}> {
  // 1. Criar o job no banco
  const job = await createJob({
    query: params.query,
    location: params.location,
    radius_or_zoom: String(params.zoom || 15),
    status: 'running',
    total_found: 0,
  });

  // 2. Auto-Healing do Docker Engine
  onTelemetry?.(1, 5, 'Verificando e garantindo inicialização do motor Docker na porta 8080...');
  const bootStatus = await ensureScraperRunning((msg) => onTelemetry?.(1, 5, msg));
  if (!bootStatus.online) {
    await updateJob(job.id, { status: 'failed' });
    throw new Error(
      `Motor Scraper Docker offline. Erro ao auto-iniciar: ${bootStatus.error || bootStatus.message}`
    );
  }

  // 3. Geocoding
  onTelemetry?.(2, 5, `Geocodificando coordenadas para: "${params.location}"...`);
  let lat = params.lat;
  let lon = params.lon;
  if (!lat || !lon) {
    const geo = await geocodeLocation(params.location);
    if (!geo) {
      await updateJob(job.id, { status: 'failed' });
      throw new Error(`Não foi possível obter coordenadas para: "${params.location}".`);
    }
    lat = geo.lat;
    lon = geo.lon;
  }

  // 4. Disparo do job na API do container
  onTelemetry?.(3, 5, `Varrendo Google Maps com nicho "${params.query}" (depth: ${params.depth || 5})...`);
  const body = {
    name: `lead-intel-${job.id.slice(0, 8)}`,
    keywords: [`${params.query} em ${params.location}`],
    lang: 'pt-BR',
    zoom: params.zoom || 15,
    lat: String(lat),
    lon: String(lon),
    fast_mode: false,
    radius: params.radius || 10000,
    depth: params.depth || 5,
    email: false,
    max_time: 600,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
  };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  const createRes = await fetch(`${BASE_URL}/api/v1/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    await updateJob(job.id, { status: 'failed' });
    throw new Error(`Falha ao registrar job na engine (${createRes.status}): ${errText}`);
  }

  const jobCreatedData = await createRes.json();
  const externalJobId = jobCreatedData.id;
  await updateJob(job.id, { external_job_id: externalJobId });

  // 5. Polling de status
  let attempts = 0;
  let isDone = false;
  while (attempts < 120 && !isDone) {
    await new Promise((r) => setTimeout(r, 4000));
    attempts++;

    const pollRes = await fetch(`${BASE_URL}/api/v1/jobs/${externalJobId}`, {
      method: 'GET',
      headers,
    });

    if (pollRes.ok) {
      const pollData = await pollRes.json();
      const status = pollData.Status;

      onTelemetry?.(3, 5, `Varredura em andamento no Maps... (ciclo ${attempts}, status: ${status})`);

      if (status === 'ok') {
        isDone = true;
      } else if (status === 'failed') {
        await updateJob(job.id, { status: 'failed' });
        throw new Error('O job foi cancelado ou falhou na engine do scraper.');
      }
    }
  }

  if (!isDone) {
    await updateJob(job.id, { status: 'failed' });
    throw new Error('Tempo limite de espera esgotado na engine.');
  }

  // 6. Download do CSV
  const downloadRes = await fetch(`${BASE_URL}/api/v1/jobs/${externalJobId}/download`, { headers });
  if (!downloadRes.ok) {
    await updateJob(job.id, { status: 'failed' });
    throw new Error('Falha ao baixar os resultados CSV da busca.');
  }

  const csvRaw = await downloadRes.text();
  const rawRows = parseCSV(csvRaw);

  // 7. Auditoria técnica Zero-Token & Extração Geográfica Exata
  onTelemetry?.(4, 5, `Auditando ${rawRows.length} estabelecimentos (SSL, Pixels, Linktree, Contatos)...`);
  const processedLeads: Lead[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const placeId = row.place_id || row.cid || row.link || `gen_${crypto.randomUUID()}`;
    const name = row.title || row.name || 'Empresa Local';
    const category = row.category || row.type || null;
    const address = row.address || null;
    const rawWebsite = row.website || row.link_website || null;
    const rating = parseFloat(row.review_rating || row.rating || '0') || 0;
    const reviewsCount = parseInt(row.review_count || row.reviews || '0', 10) || 0;

    // Coordenadas geográficas exatas do CSV
    let rowLat = parseFloat(row.latitude);
    let rowLon = parseFloat(row.longitude);

    if (isNaN(rowLat) || isNaN(rowLon) || (rowLat === 0 && rowLon === 0)) {
      if (lat && lon) {
        // Leve dispersão realista se coordenadas vierem nulas
        rowLat = parseFloat(lat) + (Math.random() - 0.5) * 0.015;
        rowLon = parseFloat(lon) + (Math.random() - 0.5) * 0.015;
      }
    }

    // Normalização de telefone
    let { phone, whatsapp_link } = normalizeBrazilianPhone(row.phone);

    // Auditoria técnica de Website determinística + Linktree Unroller
    const audit = await auditWebsite(rawWebsite);

    // Se a auditoria descobriu WhatsApp oculto no Linktree
    if (!whatsapp_link && audit.discovered_whatsapp) {
      whatsapp_link = audit.discovered_whatsapp;
    }

    // Cálculo do Opportunity Score
    const scoring = calculateOpportunityScore({
      rating,
      reviews_count: reviewsCount,
      website_type: audit.website_type,
      site_status: audit.site_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      whatsapp_link,
      phone,
    });

    const leadRecord = await upsertLead({
      place_id: placeId,
      job_id: job.id,
      name,
      category,
      address,
      neighborhood: extractNeighborhood(address),
      city: params.location,
      phone,
      whatsapp_link,
      rating,
      reviews_count: reviewsCount,
      raw_website: rawWebsite,
      latitude: !isNaN(rowLat) ? rowLat : null,
      longitude: !isNaN(rowLon) ? rowLon : null,
      website_type: audit.website_type,
      site_status: audit.site_status,
      audit_status: audit.audit_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      extracted_emails: audit.extracted_emails,
      social_links: audit.social_links,
      linktree_links: audit.linktree_links,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      opportunity_score: scoring.score,
      opportunity_tags: scoring.tags,
      crm_stage: 'new',
    });

    processedLeads.push(leadRecord);
  }

  onTelemetry?.(5, 5, `Concluído: ${processedLeads.length} leads qualificados e plotados no mapa!`);

  await updateJob(job.id, {
    status: 'completed',
    total_found: processedLeads.length,
  });

  return {
    job: { ...job, status: 'completed', total_found: processedLeads.length },
    leads: processedLeads,
  };
}

function extractNeighborhood(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split('-');
  if (parts.length >= 2) {
    const possible = parts[1].split(',')[0].trim();
    if (possible && possible.length < 40) return possible;
  }
  return null;
}

/**
 * Dados de demonstração enriquecidos com coordenadas exatas para visualização no mapa
 */
export async function seedSampleLeads(): Promise<Lead[]> {
  const samples = [
    {
      place_id: 'ChIJ_sample_pizzaria_01',
      name: 'Pizzaria Bella Forneria & Forno a Lenha',
      category: 'Pizzaria',
      address: 'Av. Elza Lucchi, 450 - Ponte do Imaruim, Palhoça - SC',
      neighborhood: 'Ponte do Imaruim',
      city: 'Palhoça - SC',
      latitude: -27.6385,
      longitude: -48.6622,
      phone: '(48) 99841-2233',
      raw_website: 'https://linktr.ee/bellafforneria',
      rating: 4.8,
      reviews_count: 142,
    },
    {
      place_id: 'ChIJ_sample_clinica_02',
      name: 'Clínica OdontoLife Especialidades',
      category: 'Clínica Odontológica',
      address: 'R. Pref. Reinoldo Alves, 88 - Passa Vinte, Palhoça - SC',
      neighborhood: 'Passa Vinte',
      city: 'Palhoça - SC',
      latitude: -27.6441,
      longitude: -48.6710,
      phone: '(48) 98455-8910',
      raw_website: 'http://odontolifepalhoca.com.br',
      rating: 4.6,
      reviews_count: 67,
    },
    {
      place_id: 'ChIJ_sample_construtora_03',
      name: 'Aliança Construtora & Reformas Prediais',
      category: 'Empresa de Construção Civil',
      address: 'R. Najla Carone Goedert, 310 - Pagani, Palhoça - SC',
      neighborhood: 'Pagani',
      city: 'Palhoça - SC',
      latitude: -27.6492,
      longitude: -48.6789,
      phone: '(48) 99102-3344',
      raw_website: '',
      rating: 4.9,
      reviews_count: 53,
    },
    {
      place_id: 'ChIJ_sample_advocacia_04',
      name: 'Borges & Silva Advocacia Empresarial',
      category: 'Escritório de Advocacia',
      address: 'Av. Atílio Pedro Pagani, 120 - Pagani, Palhoça - SC',
      neighborhood: 'Pagani',
      city: 'Palhoça - SC',
      latitude: -27.6515,
      longitude: -48.6812,
      phone: '(48) 3242-1090',
      raw_website: 'https://linktr.ee/borgesadvogados',
      rating: 4.3,
      reviews_count: 38,
    },
    {
      place_id: 'ChIJ_sample_acrobacia_05',
      name: 'Studio Pilates & Fisioterapia Equilíbrio',
      category: 'Estúdio de Pilates',
      address: 'R. Ver. Arthur Manoel Mariano, 500 - Forquilhinhas, São José - SC',
      neighborhood: 'Forquilhinhas',
      city: 'São José - SC',
      latitude: -27.5982,
      longitude: -48.6415,
      phone: '(48) 99611-7788',
      raw_website: 'https://pilatesequilibriosj.com.br',
      rating: 4.9,
      reviews_count: 94,
    },
    {
      place_id: 'ChIJ_sample_mecanica_06',
      name: 'Auto Mecânica Express & Injeção Eletrônica',
      category: 'Oficina Mecânica',
      address: 'Marginal BR-101, Km 214 - Jardim Eldorado, Palhoça - SC',
      neighborhood: 'Jardim Eldorado',
      city: 'Palhoça - SC',
      latitude: -27.6250,
      longitude: -48.6570,
      phone: '(48) 98833-2211',
      raw_website: 'http://automecanicaexpresssc.com.br', // Expira / Fora do ar
      rating: 4.7,
      reviews_count: 78,
    },
  ];

  const results: Lead[] = [];
  for (const s of samples) {
    const { phone, whatsapp_link } = normalizeBrazilianPhone(s.phone);
    const audit = await auditWebsite(s.raw_website, { skipPageSpeed: true });

    // Customizações realistas para teste rico de mapa e diagnóstico
    if (s.name.includes('OdontoLife')) {
      audit.has_ssl = false;
      audit.is_responsive = false;
      audit.cms_or_stack = 'WordPress';
      audit.has_meta_pixel = true;
      audit.site_status = 'online';
      audit.pagespeed_mobile_score = 34;
      audit.extracted_emails = ['contato@odontolifepalhoca.com.br'];
    } else if (s.name.includes('Auto Mecânica')) {
      audit.site_status = 'offline_or_expired';
      audit.has_ssl = false;
      audit.is_responsive = false;
    } else if (s.name.includes('Bella Forneria')) {
      audit.linktree_links = {
        'Cardápio Digital': 'https://cardapio.bellafforneria.com',
        'WhatsApp Pedidos': 'https://wa.me/5548998412233',
        'Instagram': 'https://instagram.com/bellafforneria',
      };
    }

    const scoring = calculateOpportunityScore({
      rating: s.rating,
      reviews_count: s.reviews_count,
      website_type: audit.website_type,
      site_status: audit.site_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      whatsapp_link,
      phone,
    });

    const lead = await upsertLead({
      place_id: s.place_id,
      name: s.name,
      category: s.category,
      address: s.address,
      neighborhood: s.neighborhood,
      city: s.city,
      latitude: s.latitude,
      longitude: s.longitude,
      phone,
      whatsapp_link,
      rating: s.rating,
      reviews_count: s.reviews_count,
      raw_website: s.raw_website,
      website_type: audit.website_type,
      site_status: audit.site_status,
      audit_status: audit.audit_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      extracted_emails: audit.extracted_emails,
      social_links: audit.social_links,
      linktree_links: audit.linktree_links,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      opportunity_score: scoring.score,
      opportunity_tags: scoring.tags,
      crm_stage: 'new',
    });

    results.push(lead);
  }

  return results;
}
