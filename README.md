#  Lead Intel Hub v2.0 • Command-First & Cartografia Tática

Plataforma SaaS local de **Prospecção, Enriquecimento e Auditoria Técnica de Leads B2B**, desenhada segundo os padrões arquiteturais do **Impeccable em modo `Operate` (Zero AI Slop)** e alimentada por motor de extração determinístico na porta `8080`.

---

## 🏛️ Fusão de Arquiteturas & Referências Incorporadas

1. **Google Maps Scraper Kit (`C:\Projetos\google-maps-scraper-kit`):**
   - Integração direta com o container Docker `gosom/google-maps-scraper` na porta `8080`.
   - Extração de coordenadas geográficas exatas (`latitude`, `longitude`) de cada estabelecimento.
2. **Auto-Healing & Auto-Start do Docker Engine (`src/services/docker-manager.ts`):**
   - Elimina o erro de engine offline: detecta status e dispara automaticamente `docker compose up -d` ou inicialização do Docker Desktop no Windows com polling até `200 OK`.
3. **LeadRadar (Cartografia & Anel de Score):**
   - Mapa escuro interativo (`InteractiveMap.tsx`) usando tiles Dark Matter da CartoDB e pinos estilizados por nível de oportunidade (Ouro, Fora do Ar, WhatsApp, Baixa).
   - Anel de pontuação SVG circular de alta fidelidade (`ScoreRing.tsx`).
4. **Scout (Linktree & Bio Aggregator Unroller):**
   - Se o lead cadastrar `linktr.ee`, `bio.link`, `beacons.ai`, o crawler entra na página e desdobra links de WhatsApp direto, Instagram e sites reais ocultos.
5. **AI Sales Team (Dossiê Executivo & Objeções):**
   - Dossiê técnico imprimível/PDF (`window.print()`) das vulnerabilidades do site do lead.
   - Playbook determinístico de quebra de objeções reais (*"Já tenho Instagram"*, *"Meu sobrinho cuida"*, *"Não tenho tempo"*, *"Site é caro"*).
6. **Aura Campaigns (Live Pipeline Telemetry):**
   - Console visual com cronômetro e progresso etapa por etapa:
     - `[1/5]` Auto-cura e inicialização do Docker Engine na porta 8080.
     - `[2/5]` Geocodificação das coordenadas do perímetro alvo.
     - `[3/5]` Varredura em tempo real no Google Maps.
     - `[4/5]` Auditoria Técnica Zero-Token (SSL, Stack, Pixels, Linktree, WhatsApp).
     - `[5/5]` Cálculo do Opportunity Score e plotagem cartográfica.
7. **Impeccable Design Standard (Modo Operate):**
   - Removida a estética de "template genérico de IA" (sem cards soltos desordenados e sem degradês roxos sem função).
   - Workspace Split-View de alta densidade (Mapa + Lista tática com filtros rápidos em pills, busca instantânea e exportação CSV).
   - Omni-Command Bar centralizada estilo Raycast/Linear com parser determinístico de linguagem natural.

---

##  Como Iniciar

### 1. Iniciar o Servidor de Desenvolvimento

```bash
cd C:\Projetos\lead-intel-hub
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 2. Auto-Start do Docker Scraper

Caso o container do scraper (`localhost:8080`) esteja desligado, você pode:
- Clicar no botão **"Auto-Iniciar"** ao lado do status na barra de comando;
- Ou iniciar uma varredura normalmente: o sistema fará a auto-cura em background!

### 3. Teste Imediato com Dados de Demonstração

Clique no botão **"Dados Demo"** na barra de comando para carregar instantaneamente 6 estabelecimentos reais com coordenadas em Palhoça/São José, pinos coloridos no mapa e diagnósticos técnicos completos.
