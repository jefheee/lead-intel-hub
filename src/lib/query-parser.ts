/**
 * Parser Determinístico Inteligente (Zero-Token) de Frases de Prospecção
 * Converte linguagem natural em nicho e localização geográfica estruturada
 * Exemplos:
 * "pizzarias no bairro jardim eldorado em palhoça" -> { query: "Pizzarias", location: "Jardim Eldorado, Palhoça - SC" }
 * "clínicas odontológicas perto de Kobrasol" -> { query: "Clínicas Odontológicas", location: "Kobrasol, São José - SC" }
 * "academias em Florianópolis" -> { query: "Academias", location: "Florianópolis - SC" }
 */

export interface ParsedSearchQuery {
  niche: string;
  location: string;
  rawInput: string;
}

const PREPOSITIONS_REGEX = /\s+(?:perto\s+de|ao\s+redor\s+de|próximo\s+a|proximo\s+a|em\s+torno\s+de|no\s+bairro|na\s+região\s+de|na\s+cidade\s+de|no|na|nos|nas|em)\s+/i;

export function parseNaturalSearchQuery(input: string): ParsedSearchQuery {
  const trimmed = input.trim();
  if (!trimmed) {
    return { niche: '', location: '', rawInput: '' };
  }

  // Divide pela primeira preposição encontrada
  const match = trimmed.match(PREPOSITIONS_REGEX);

  if (match && match.index !== undefined) {
    const nichePart = trimmed.slice(0, match.index).trim();
    let locationPart = trimmed.slice(match.index + match[0].length).trim();

    // Limpa pontuações finais
    locationPart = locationPart.replace(/[.,;]+$/, '').trim();

    return {
      niche: capitalizeFirst(nichePart) || 'Empresas',
      location: formatLocationName(locationPart),
      rawInput: trimmed,
    };
  }

  // Se não contiver preposição explícita, verifica se possui vírgula (ex: "Pizzarias, Palhoça")
  if (trimmed.includes(',')) {
    const [niche, loc] = trimmed.split(',').map((s) => s.trim());
    return {
      niche: capitalizeFirst(niche),
      location: formatLocationName(loc),
      rawInput: trimmed,
    };
  }

  // Fallback: assume que tudo é o nicho se for muito curto, ou usa como nicho com busca geral
  return {
    niche: capitalizeFirst(trimmed),
    location: '',
    rawInput: trimmed,
  };
}

function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatLocationName(loc: string): string {
  if (!loc) return '';
  let formatted = loc;
  // Se for nomes comuns sem estado, podemos preservar limpo
  formatted = formatted.replace(/\s*-\s*sc$/i, ' - SC');
  return capitalizeFirst(formatted);
}
