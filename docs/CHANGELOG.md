# Changelog - Lead Intel Hub

## [2026-10-24] - Blindagem de Segurança do Git e Higienização de Metadados
- **Arquivos Desrastreados do Git:** `.env.local`, `.cursor/`, `.gemini/` e `tsconfig.tsbuildinfo` removidos do índice (`git rm --cached`) mantendo arquivos locais intactos.
- **Gitignore Atualizado:** Adicionadas regras estritas para variáveis de ambiente e pastas de agentes de IA.
- **Proteção Global:** Criado `~/.gitignore_global` e ativado `core.excludesfile` no sistema.
- **Arquivos Afetados:** `.gitignore`, `docs/CHANGELOG.md`.

## [2026-10-24] - Provisionamento do Backend Supabase e Ambiente Local
- **Conta Supabase Utilizada:** `supabase_c2` (Organização `JF 2`, Região `sa-east-1` - São Paulo).
- **Projeto Criado:** `lead-intel-hub` (Ref: `mhabihpznertjmvxampi`).
- **Migração Executada:** `supabase/migrations/001_init_leads_schema.sql` criando enums, tabelas `scraping_jobs` e `leads`, índices espaciais/filtros e políticas RLS.
- **Ambiente Local:** Variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` populadas em `.env.local`.
- **Arquivos Afetados:** `.env.local`, `docs/PROJECT_STATE.md`, `docs/CHANGELOG.md`.
