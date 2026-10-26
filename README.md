# Lead Intel Hub

A local B2B prospecting, technical audit, and tactical intelligence workspace built for high-conversion outreach.

Instead of generic contact scraping, Lead Intel Hub pairs Google Maps geo-extraction with automated zero-token technical audits (SSL, modern stack, missing pixels, unrolled link-in-bio aggregators) and calculates an actionable **Opportunity Score** for each business.

---

## Key Features

- **Tactical Cartography & Split-View:** Interactive dark-mode map powered by Leaflet & CartoDB Dark Matter tiles, plotted alongside a high-density, searchable lead registry.
- **Automated Google Maps Extraction:** Scrapes local business perimeters with coordinates, contact info, ratings, and operational status.
- **Docker Auto-Healing:** Automatically verifies, restarts, and polls the local extraction engine container (`localhost:8080`) without manual terminal intervention.
- **Zero-Token Technical Audits:**
  - Evaluates website reachability, SSL health, tech stack, and marketing pixel presence.
  - **Bio Unroller:** Automatically crawls `linktr.ee`, `bio.link`, and `beacons.ai` targets to surface hidden WhatsApp and direct URLs.
- **Opportunity Scoring (0–100):** Prioritizes leads with the highest conversion potential (e.g., strong Google reviews but broken/missing website or missing analytics).
- **Executive Dossier & Objection Playbook:** Printable client audit reports (`window.print()`) and built-in sales objection counters ready for immediate outreach.
- **Live Pipeline Telemetry:** Real-time feedback console showing multi-step job execution times, scraping counts, and geo-perimeter progress.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Language:** TypeScript
- **UI & Styling:** Tailwind CSS, Lucide Icons, Framer Motion
- **Maps:** Leaflet & React-Leaflet
- **Database & Storage:** Supabase (PostgreSQL 17 with Row-Level Security)
- **AI Integrations:** Google GenAI SDK (`@google/genai`)

---

## Getting Started

### 1. Prerequisites

- **Node.js** 18.17+ or later
- **Docker Desktop** (running, if using the local scraper engine container)

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional (for AI pitch generation)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Workflow Overview

1. **Trigger Scan:** Enter a business query and target radius in the Omni-Command bar (e.g., *"Clínicas odontológicas em São Paulo"*).
2. **Auto-Cure & Extract:** The Docker manager ensures the scraping service is running, geocodes the target boundary, and streams records.
3. **Audit & Score:** The pipeline inspects each business domain, unrolls aggregators, verifies WhatsApp links, and assigns an Opportunity Score.
4. **Take Action:** Filter by opportunity tiers, open the deep-dive drawer, print an executive dossier, or export results directly to CSV.
