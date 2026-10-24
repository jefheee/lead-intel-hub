import { ScrapeRequestParams, ScraperHealthStatus, ScrapingJob, Lead } from '@/types';
import { auditWebsite, normalizeBrazilianPhone } from './website-auditor';
import { calculateOpportunityScore } from './scoring-engine';
import { createJob, updateJob, upsertLead } from '@/lib/db';

const BASE_URL = process.env.SCRAPER_BASE_URL || `http://localhost:${process.env.SCRAPER_PORT || '8080'}`;
const API_KEY = process.env.SCRAPER_API_KEY || '';
const USER_AGENT = 'lead-intel-hub/1.0 (https://github.com/Mahanaicoach/google-maps-scraper-kit)';

export async function checkScraperHealth(): Promise<ScraperHealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
    };
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
      headers: {
        'User-Agent': USER_AGENT,
      },
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

  // Parse header
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

export async function triggerScrapingPipeline(params: ScrapeRequestParams): Promise<{
  job: ScrapingJob;
  leads: Lead[];
}> {
  // 1. Criar o job no banco de dados local/supabase
  const job = await createJob({
    query: params.query,
    location: params.location,
    radius_or_zoom: String(params.zoom || 15),
    status: 'running',
    total_found: 0,
  });

  // 2. Health check preliminar
  const health = await checkScraperHealth();
  if (!health.online) {
    await updateJob(job.id, { status: 'failed' });
    throw new Error(
      `Motor Scraper Docker offline em ${BASE_URL}. Inicie o container com: docker compose -f C:\\Projetos\\google-maps-scraper-kit\\docker-compose.yml up -d`
    );
  }

  // 3. Geocoding
  let lat = params.lat;
  let lon = params.lon;
  if (!lat || !lon) {
    const geo = await geocodeLocation(params.location);
    if (!geo) {
      await updateJob(job.id, { status: 'failed' });
      throw new Error(`Não foi possível geolocalizar o local informado: "${params.location}". Forneça coordenadas ou cidade/estado válidos.`);
    }
    lat = geo.lat;
    lon = geo.lon;
  }

  // 4. Disparo do job na API do container gosom/google-maps-scraper
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
    throw new Error(`Falha ao registrar job na engine Docker (${createRes.status}): ${errText}`);
  }

  const jobCreatedData = await createRes.json();
  const externalJobId = jobCreatedData.id;
  await updateJob(job.id, { external_job_id: externalJobId });

  // 5. Polling de status
  let attempts = 0;
  let isDone = false;
  while (attempts < 120 && !isDone) {
    await new Promise((r) => setTimeout(r, 6000));
    attempts++;

    const pollRes = await fetch(`${BASE_URL}/api/v1/jobs/${externalJobId}`, {
      method: 'GET',
      headers,
    });

    if (pollRes.ok) {
      const pollData = await pollRes.json();
      const status = pollData.Status;

      if (status === 'ok') {
        isDone = true;
      } else if (status === 'failed') {
        await updateJob(job.id, { status: 'failed' });
        throw new Error('O job foi marcado como com falha pelo scraper no container Docker.');
      }
    }
  }

  if (!isDone) {
    await updateJob(job.id, { status: 'failed' });
    throw new Error('Tempo limite de execução atingido ao aguardar o scraper Docker.');
  }

  // 6. Download do CSV
  const downloadRes = await fetch(`${BASE_URL}/api/v1/jobs/${externalJobId}/download`, {
    headers,
  });

  if (!downloadRes.ok) {
    await updateJob(job.id, { status: 'failed' });
    throw new Error('Falha ao baixar os resultados CSV da engine do scraper.');
  }

  const csvRaw = await downloadRes.text();
  const rawRows = parseCSV(csvRaw);

  // 7. Processamento determinístico Zero-Token & UPSERT
  const processedLeads: Lead[] = [];

  for (const row of rawRows) {
    const placeId = row.place_id || row.cid || row.link || `gen_${crypto.randomUUID()}`;
    const name = row.title || row.name || 'Empresa Local';
    const category = row.category || row.type || null;
    const address = row.address || null;
    const rawWebsite = row.website || row.link_website || null;
    const rating = parseFloat(row.review_rating || row.rating || '0') || 0;
    const reviewsCount = parseInt(row.review_count || row.reviews || '0', 10) || 0;

    // Normalização de telefone e WhatsApp
    const { phone, whatsapp_link } = normalizeBrazilianPhone(row.phone);

    // Auditoria técnica de Website determinística
    const audit = await auditWebsite(rawWebsite);

    // Cálculo do Opportunity Score
    const scoring = calculateOpportunityScore({
      rating,
      reviews_count: reviewsCount,
      website_type: audit.website_type,
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
      website_type: audit.website_type,
      audit_status: audit.audit_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      extracted_emails: audit.extracted_emails,
      social_links: audit.social_links,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      opportunity_score: scoring.score,
      opportunity_tags: scoring.tags,
      crm_stage: 'new',
    });

    processedLeads.push(leadRecord);
  }

  // 8. Atualiza o job para completed
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
  // Endereço típico Maps BR: "Rua Exemplo, 123 - Centro, Florianópolis - SC, 88000-000"
  const parts = address.split('-');
  if (parts.length >= 2) {
    const possible = parts[1].split(',')[0].trim();
    if (possible && possible.length < 40) return possible;
  }
  return null;
}

/**
 * Função de sementes / demonstração para enriquecer a UI com dados reais caso o Docker não esteja ligado
 */
export async function seedSampleLeads(): Promise<Lead[]> {
  const samples = [
    {
      place_id: 'ChIJ_sample_pizzaria_01',
      name: 'Pizzaria Bella Forneria & Massas',
      category: 'Pizzaria',
      address: 'Av. Elza Lucchi, 450 - Ponte do Imaruim, Palhoça - SC',
      neighborhood: 'Ponte do Imaruim',
      city: 'Palhoça - SC',
      phone: '(48) 99841-2233',
      raw_website: 'https://instagram.com/bellafforneria',
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
      phone: '(48) 98455-8910',
      raw_website: 'http://odontolifepalhoca.com.br',
      rating: 4.6,
      reviews_count: 67,
    },
    {
      place_id: 'ChIJ_sample_construtora_03',
      name: 'Aliança Construtora & Reformas',
      category: 'Empresa de Construção Civil',
      address: 'R. Najla Carone Goedert, 310 - Pagani, Palhoça - SC',
      neighborhood: 'Pagani',
      city: 'Palhoça - SC',
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
      phone: '(48) 3242-1090',
      raw_website: 'https://linktr.ee/borgesadvogados',
      rating: 4.3,
      reviews_count: 38,
    },
  ];

  const results: Lead[] = [];
  for (const s of samples) {
    const { phone, whatsapp_link } = normalizeBrazilianPhone(s.phone);
    const audit = await auditWebsite(s.raw_website, { skipPageSpeed: true });

    // Customizações realistas para demonstração imediata
    if (s.name.includes('OdontoLife')) {
      audit.has_ssl = false;
      audit.is_responsive = false;
      audit.cms_or_stack = 'WordPress';
      audit.has_meta_pixel = true;
      audit.pagespeed_mobile_score = 34;
      audit.extracted_emails = ['contato@odontolifepalhoca.com.br'];
    }

    const scoring = calculateOpportunityScore({
      rating: s.rating,
      reviews_count: s.reviews_count,
      website_type: audit.website_type,
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
      phone,
      whatsapp_link,
      rating: s.rating,
      reviews_count: s.reviews_count,
      raw_website: s.raw_website,
      website_type: audit.website_type,
      audit_status: audit.audit_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      extracted_emails: audit.extracted_emails,
      social_links: audit.social_links,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      opportunity_score: scoring.score,
      opportunity_tags: scoring.tags,
      crm_stage: 'new',
    });

    results.push(lead);
  }

  return results;
}
