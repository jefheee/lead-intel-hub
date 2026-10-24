import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';
import { Lead, ScrapingJob } from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalData<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function writeLocalData<T>(filePath: string, data: T[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

export async function upsertLead(leadData: Partial<Lead> & { place_id: string }): Promise<Lead> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('leads')
      .upsert(
        {
          ...leadData,
          updated_at: now,
        },
        { onConflict: 'place_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase upsert lead failed, falling back to local file storage:', error.message);
    } else if (data) {
      return data as Lead;
    }
  }

  // Local fallback
  const leads = readLocalData<Lead>(LEADS_FILE);
  const existingIndex = leads.findIndex((l) => l.place_id === leadData.place_id);

  let result: Lead;
  if (existingIndex >= 0) {
    result = {
      ...leads[existingIndex],
      ...leadData,
      updated_at: now,
    };
    leads[existingIndex] = result;
  } else {
    result = {
      id: leadData.id || crypto.randomUUID(),
      place_id: leadData.place_id,
      job_id: leadData.job_id || null,
      name: leadData.name || 'Empresa sem nome',
      category: leadData.category || null,
      address: leadData.address || null,
      neighborhood: leadData.neighborhood || null,
      city: leadData.city || null,
      phone: leadData.phone || null,
      whatsapp_link: leadData.whatsapp_link || null,
      rating: leadData.rating || 0,
      reviews_count: leadData.reviews_count || 0,
      raw_website: leadData.raw_website || null,
      website_type: leadData.website_type || 'none',
      audit_status: leadData.audit_status || 'pending',
      has_ssl: leadData.has_ssl ?? false,
      is_responsive: leadData.is_responsive ?? false,
      cms_or_stack: leadData.cms_or_stack || null,
      has_meta_pixel: leadData.has_meta_pixel ?? false,
      has_google_tags: leadData.has_google_tags ?? false,
      extracted_emails: leadData.extracted_emails || [],
      social_links: leadData.social_links || {},
      pagespeed_mobile_score: leadData.pagespeed_mobile_score ?? null,
      opportunity_score: leadData.opportunity_score ?? 0,
      opportunity_tags: leadData.opportunity_tags || [],
      ai_pitch: leadData.ai_pitch || null,
      crm_stage: leadData.crm_stage || 'new',
      created_at: now,
      updated_at: now,
    };
    leads.unshift(result);
  }

  writeLocalData(LEADS_FILE, leads);
  return result;
}

export async function getLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('opportunity_score', { ascending: false });

    if (!error && data) {
      return data as Lead[];
    }
  }

  return readLocalData<Lead>(LEADS_FILE).sort(
    (a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0)
  );
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return data as Lead;
    }
  }

  const leads = readLocalData<Lead>(LEADS_FILE);
  return leads.find((l) => l.id === id) || null;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: now })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      return data as Lead;
    }
  }

  const leads = readLocalData<Lead>(LEADS_FILE);
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  leads[idx] = {
    ...leads[idx],
    ...updates,
    updated_at: now,
  };

  writeLocalData(LEADS_FILE, leads);
  return leads[idx];
}

export async function createJob(jobData: Partial<ScrapingJob>): Promise<ScrapingJob> {
  const now = new Date().toISOString();
  const job: ScrapingJob = {
    id: jobData.id || crypto.randomUUID(),
    query: jobData.query || '',
    location: jobData.location || '',
    radius_or_zoom: jobData.radius_or_zoom || '15',
    status: jobData.status || 'pending',
    external_job_id: jobData.external_job_id || null,
    total_found: jobData.total_found || 0,
    created_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .insert([job])
      .select('*')
      .single();

    if (!error && data) {
      return data as ScrapingJob;
    }
  }

  const jobs = readLocalData<ScrapingJob>(JOBS_FILE);
  jobs.unshift(job);
  writeLocalData(JOBS_FILE, jobs);
  return job;
}

export async function updateJob(id: string, updates: Partial<ScrapingJob>): Promise<ScrapingJob | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      return data as ScrapingJob;
    }
  }

  const jobs = readLocalData<ScrapingJob>(JOBS_FILE);
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;

  jobs[idx] = { ...jobs[idx], ...updates };
  writeLocalData(JOBS_FILE, jobs);
  return jobs[idx];
}

export async function getJobs(): Promise<ScrapingJob[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as ScrapingJob[];
    }
  }

  return readLocalData<ScrapingJob>(JOBS_FILE);
}
