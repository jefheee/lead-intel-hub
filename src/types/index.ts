export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type WebsiteType = 'none' | 'social_or_linktree' | 'custom_domain';

export type AuditStatus = 'pending' | 'completed' | 'failed';

export type CrmStage = 'new' | 'qualified' | 'contacted' | 'negotiating' | 'won' | 'discarded';

export interface ScrapingJob {
  id: string;
  query: string;
  location: string;
  radius_or_zoom: string;
  status: JobStatus;
  external_job_id: string | null;
  total_found: number;
  created_at: string;
}

export interface Lead {
  id: string;
  place_id: string;
  job_id: string | null;
  name: string;
  category: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  phone: string | null;
  whatsapp_link: string | null;
  rating: number;
  reviews_count: number;
  raw_website: string | null;
  
  // Technical & Qualification fields
  website_type: WebsiteType;
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
  pagespeed_mobile_score: number | null;
  
  // Scoring
  opportunity_score: number;
  opportunity_tags: string[];
  
  // Outreach
  ai_pitch: string | null;
  crm_stage: CrmStage;
  created_at: string;
  updated_at: string;
}

export interface ScrapeRequestParams {
  query: string;
  location: string;
  depth?: number;
  lat?: string;
  lon?: string;
  radius?: number;
  zoom?: number;
}

export interface ScraperHealthStatus {
  online: boolean;
  url: string;
  error?: string;
}
