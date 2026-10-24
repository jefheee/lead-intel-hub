# 📌 Lead Intel Hub - Estado Atual do Projeto

**Última Atualização:** 24 de Outubro de 2026  
**Status do Projeto:** Em Desenvolvimento Ativo  
**Ambiente / Infra:** Next.js 14+ / Supabase (Região: `sa-east-1` / São Paulo)

---

## 🛠️ 1. Stack Tecnológica
- **Framework:** Next.js 14 (App Router, Server Actions)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + Lucide Icons + Leaflet (Mapas)
- **Banco de Dados:** Supabase (PostgreSQL 17 com RLS ativado)
- **Servidor MCP Supabase:** `supabase_c2` (Ref do Projeto: `mhabihpznertjmvxampi`)

---

## 🗄️ 2. Modelo de Dados (Supabase)
- **`scraping_jobs`**: Histórico e status de execuções de scraping de leads (Google Maps / local).
- **`leads`**: Registro consolidado de empresas e oportunidades (geo-localização, links de redes, score de oportunidade de 0 a 100, auditoria técnica e estágio de CRM).
- **Políticas RLS:** Ativas em ambas as tabelas.

---

## 🚦 3. Status das Funcionalidades
- [x] Provisionamento autônomo do banco de dados remoto Supabase via MCP.
- [x] Configuração de credenciais (`NEXT_PUBLIC_SUPABASE_URL`, anon key e service role) em `.env.local`.
- [x] Aplicação da migração inicial DDL (`001_init_leads_schema.sql`).
- [ ] Conexão da UI do mapa interativo e tabela de leads com o Supabase.
- [ ] Módulo de pitch generator via Gemini AI.
