-- ==============================================================================
-- LEAD INTEL HUB - MIGRATION 001: LEADS & SCRAPING JOBS SCHEMA
-- ==============================================================================

-- 1. Create Enums (or domain checks)
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE website_type_enum AS ENUM ('none', 'social_or_linktree', 'custom_domain');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_status_enum AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_stage_enum AS ENUM ('new', 'qualified', 'contacted', 'negotiating', 'won', 'discarded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Table: scraping_jobs
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    location TEXT NOT NULL,
    radius_or_zoom TEXT DEFAULT '15',
    status job_status NOT NULL DEFAULT 'pending',
    external_job_id TEXT,
    total_found INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Table: leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT UNIQUE NOT NULL,
    job_id UUID REFERENCES scraping_jobs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT,
    address TEXT,
    neighborhood TEXT,
    city TEXT,
    phone TEXT,
    whatsapp_link TEXT,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    raw_website TEXT,
    
    -- Technical & Qualification audit fields
    website_type website_type_enum NOT NULL DEFAULT 'none',
    audit_status audit_status_enum NOT NULL DEFAULT 'pending',
    has_ssl BOOLEAN DEFAULT false,
    is_responsive BOOLEAN DEFAULT false,
    cms_or_stack TEXT,
    has_meta_pixel BOOLEAN DEFAULT false,
    has_google_tags BOOLEAN DEFAULT false,
    extracted_emails TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}'::jsonb,
    pagespeed_mobile_score INT,
    
    -- Business opportunity score
    opportunity_score INT NOT NULL DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
    opportunity_tags TEXT[] DEFAULT '{}',
    
    -- Pitch & CRM pipeline
    ai_pitch TEXT,
    crm_stage crm_stage_enum NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Fast Lookups & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON leads(place_id);
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_score ON leads(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_crm_stage ON leads(crm_stage);
CREATE INDEX IF NOT EXISTS idx_leads_job_id ON leads(job_id);
CREATE INDEX IF NOT EXISTS idx_leads_website_type ON leads(website_type);
CREATE INDEX IF NOT EXISTS idx_leads_audit_status ON leads(audit_status);

-- 5. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS and permissive local policies
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow all read on scraping_jobs" ON scraping_jobs FOR SELECT USING (true);
    CREATE POLICY "Allow all insert on scraping_jobs" ON scraping_jobs FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow all update on scraping_jobs" ON scraping_jobs FOR UPDATE USING (true);
    CREATE POLICY "Allow all delete on scraping_jobs" ON scraping_jobs FOR DELETE USING (true);

    CREATE POLICY "Allow all read on leads" ON leads FOR SELECT USING (true);
    CREATE POLICY "Allow all insert on leads" ON leads FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow all update on leads" ON leads FOR UPDATE USING (true);
    CREATE POLICY "Allow all delete on leads" ON leads FOR DELETE USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
