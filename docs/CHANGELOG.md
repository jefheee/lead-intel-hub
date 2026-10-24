# Changelog - Lead Intel Hub

## [2026-10-24] - Eliminação Completa de Anti-Patterns (LeadDrawer, ScoreRing, Telemetria) e Fix 422 Engine
- **Engine Scraper 422 Sanada:** Parâmetro `lang` no [scraper-bridge.ts](file:///c:/Projetos/lead-intel-hub/src/services/scraper-bridge.ts#L155) definido estritamente como `'pt'` (código ISO de 2 letras exigido pela API do container Docker `gosom/google-maps-scraper`).
- **Remoção de Fontes Microscópicas:** Substituídas todas as instâncias de `text-[9px]`, `text-[10px]` e `text-[11px]` por `text-xs` (mínimo de 12px) em [LeadDrawer.tsx](file:///c:/Projetos/lead-intel-hub/src/components/LeadDrawer.tsx), [ScoreRing.tsx](file:///c:/Projetos/lead-intel-hub/src/components/ScoreRing.tsx), [LeadsTable.tsx](file:///c:/Projetos/lead-intel-hub/src/components/LeadsTable.tsx), [MapWrapper.tsx](file:///c:/Projetos/lead-intel-hub/src/components/MapWrapper.tsx) e [CaptureRadar.tsx](file:///c:/Projetos/lead-intel-hub/src/components/CaptureRadar.tsx).
- **Remoção de All-Caps e Gradient Buttons:** Removidos títulos em caixa alta e gradientes no botão de IA e no cabeçalho de objeções do [LeadDrawer.tsx](file:///c:/Projetos/lead-intel-hub/src/components/LeadDrawer.tsx).
- **Substituição da AI Color Palette:** Badges de tags e pixels ajustados para tons neutros escuros (`bg-zinc-800 text-zinc-300 border-zinc-700`) com alto contraste legível.
- **Remoção de Halos e Glows:** Removidos filtros `drop-shadow` de brilho excessivo no [ScoreRing.tsx](file:///c:/Projetos/lead-intel-hub/src/components/ScoreRing.tsx).
- **Arquivos Afetados:** `src/services/scraper-bridge.ts`, `src/components/LeadDrawer.tsx`, `src/components/ScoreRing.tsx`, `src/components/MapWrapper.tsx`, `src/components/CaptureRadar.tsx`, `docs/CHANGELOG.md`.

## [2026-10-24] - Eliminação dos 37 Anti-Patterns de Design (Auditoria Impeccable)
- **Gradient Text Banido:** Substituído título com gradiente por tipografia sólida, nítida e hierárquica em `page.tsx`.
- **Eliminação de AI Color Palette:** Substituídas cores neon espalhadas por paleta corporativa sóbria (zinc-100 a zinc-400 com acentos semânticos de alta legibilidade).
- **Remoção de Glowing Accents:** Removidos halos com `shadow-[0_0_15px_...]` e anéis saturados em botões, pins do mapa e cards.
- **Tipografia e Tiny Text Corrigidos:** Elevadas fontes microscópicas (`text-[9px]`, `text-[10px]`, `text-[11px]`) para escala de leitura confortável (`text-xs` e `text-sm`).
- **Desaninhamento de Cards:** Estrutura de containers do CommandBar e filtros da tabela desaninhados para visual limpo.
- **Contraste de Texto:** Eliminado `gray text on colored background` em badges e marcadores do mapa.
- **Hidratação Blindada:** Implementado `mounted` state no header para blindagem total contra extensões de navegador.
- **Arquivos Afetados:** `src/app/page.tsx`, `src/components/StatsOverview.tsx`, `src/components/OmniCommandBar.tsx`, `src/components/InteractiveMap.tsx`, `src/components/LeadsTable.tsx`, `docs/CHANGELOG.md`.

## [2026-10-24] - Correção de Hydration Mismatch (Extensões de Navegador / Dark Reader)
- **Blindagem SSR/Hydration:** Adicionado `suppressHydrationWarning` em `<html>` e `<body>` no `src/app/layout.tsx`.
- **Componentes Blindados:** Adicionado `suppressHydrationWarning` nos elementos dinâmicos de `GridBackground`, `SpotlightCard` e `ShinyText`.
- **Refatoração de CSS:** Substituído style inline por classe Tailwind arbitrária `[animation-duration:8s]` no ícone `Radar` em `page.tsx`.
- **Arquivos Afetados:** `src/app/layout.tsx`, `src/components/react-bits/GridBackground.tsx`, `src/components/react-bits/SpotlightCard.tsx`, `src/components/react-bits/ShinyText.tsx`, `src/app/page.tsx`, `docs/CHANGELOG.md`.

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
