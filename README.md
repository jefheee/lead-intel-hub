# 🎯 Lead Intel Hub

Plataforma SaaS local de **Prospecção, Enriquecimento e Auditoria Técnica de Leads B2B**, desenhada para máxima eficiência operacional e **gasto ZERO de tokens de LLM** durante as etapas de extração, crawling e qualificação de negócios locais.

---

## ⚡ Filosofia de Arquitetura: Zero-Token vs. On-Demand AI

1. **Extração & Deduplicação Determinística (Zero-Token):**
   - Conexão direta com a engine local `gosom/google-maps-scraper` rodando em container Docker na porta `8080`.
   - Busca em lote por nicho + bairro/cidade com geocodificação automática via OpenStreetMap Nominatim.
   - Deduplicação rigorosa baseada no `place_id` do Google Maps.

2. **Auditoria Técnica Determinística (Zero-Token):**
   - **Classificador de URL:** Diferencia negócios sem site (`none`), perfis sociais/agregadores (`instagram.com`, `linktr.ee`, `wa.me`) e domínios próprios (`custom_domain`).
   - **Crawler Leve (Cheerio & Fetch com timeout de 8s):**
     - Checagem de certificado SSL (HTTPS válido vs. HTTP inseguro).
     - Detecção de `<meta name="viewport">` para responsividade mobile.
     - Detecção de assinaturas de tráfego pago: Meta Pixel (`fbq(`) e Google Tags / GTM (`gtag(`, `GTM-`).
     - Detecção de CMS/Stack: WordPress, Wix, Next.js, Shopify, Webflow, RD Station.
     - Regex institucional para extração de e-mails (`mailto:` e corpo) e canais sociais (Instagram, Facebook, LinkedIn).
   - **Normalizador de Telefones BR:** Converte números para o padrão internacional E.164 e gera links diretos para WhatsApp Web (`https://wa.me/55...`).
   - **Motor de Oportunidade (0 a 100 pts):** Regras de negócio matemáticas priorizando empresas com alta prova social e graves deficiências digitais.

3. **IA Generativa Sob Demanda (On-Demand Gemini 2.5 Flash):**
   - Chamada **exclusivamente sob demanda** via botão na UI ("Gerar Abordagem").
   - Utiliza o SDK unificado `@google/genai` (`gemini-2.5-flash`).
   - Produz mensagens ultra-personalizadas e consultivas para WhatsApp baseadas nos dados técnicos reais já auditados do lead.

---

## 🚀 Como Iniciar

### 1. Iniciar o Motor Scraper Docker (Porta 8080)

No repositório do scraper local (`C:\Projetos\google-maps-scraper-kit`):

```bash
docker compose up -d
```

Verifique se a engine está respondendo em `http://localhost:8080/api/v1/jobs`.

### 2. Configurar Variáveis de Ambiente

Copie o `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha os campos conforme sua necessidade:

```env
SCRAPER_BASE_URL=http://localhost:8080
SCRAPER_PORT=8080
SCRAPER_API_KEY=

# Supabase (Opcional - caso não configurado, opera com fallback local em .data/)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI (Para geração de pitchs personalizados sob demanda)
GEMINI_API_KEY=your_gemini_api_key

# PageSpeed (Opcional)
PAGESPEED_API_KEY=
```

### 3. Migração do Banco de Dados (Supabase / PostgreSQL)

Execute o script `supabase/migrations/001_init_leads_schema.sql` no SQL Editor do seu projeto Supabase para criar as tabelas `scraping_jobs` e `leads`, enums, índices e triggers de atualização.

### 4. Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📊 Estrutura de Diretórios

```
lead-intel-hub/
├── .data/                                  # Fallback local de persistência
├── supabase/
│   └── migrations/
│       └── 001_init_leads_schema.sql       # Schema DDL completo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── leads/                      # Listagem e atualização de leads
│   │   │   │   └── [id]/
│   │   │   │       ├── generate-pitch/     # Endpoint Gemini 2.5 Flash
│   │   │   │       └── re-audit/           # Re-auditoria do site
│   │   │   └── scraper/
│   │   │       ├── start/                  # Disparo de varredura
│   │   │       ├── status/                 # Health check do Docker
│   │   │       └── seed/                   # Amostras para teste imediato
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Dashboard operacional
│   │   └── globals.css
│   ├── components/
│   │   ├── CaptureRadar.tsx                # Painel de busca e status Docker
│   │   ├── LeadsTable.tsx                  # Tabela com filtros rápidos (pills)
│   │   └── LeadDrawer.tsx                  # Raio-X lateral e gerador de pitch
│   ├── lib/
│   │   ├── db.ts                           # Repositório resiliente Supabase + Local
│   │   └── supabase.ts                     # Cliente Supabase
│   ├── services/
│   │   ├── scraper-bridge.ts               # Conexão HTTP REST com engine 8080
│   │   ├── website-auditor.ts              # Crawler determinístico Cheerio/Fetch
│   │   └── scoring-engine.ts               # Cálculo do Opportunity Score (0 a 100)
│   └── types/                              # Interfaces TypeScript do sistema
├── package.json
└── tsconfig.json
```
