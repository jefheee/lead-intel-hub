import { Lead } from '@/types';

export interface ObjectionScript {
  objection: string;
  contextWhy: string;
  recommendedReply: string;
  proofAngle: string;
}

export interface SalesPlaybook {
  executiveDiagnostic: string[];
  immediateHook: string;
  objections: ObjectionScript[];
}

export function generateSalesPlaybook(lead: Lead): SalesPlaybook {
  const diagnostic: string[] = [];

  if (lead.site_status === 'offline_or_expired') {
    diagnostic.push('⚠️ DOMÍNIO FORA DO AR: O site cadastrado no Google Maps não abre ou o DNS/hospedagem expirou. Clientes que clicam encontram erro e abandonam.');
  } else if (lead.website_type === 'none') {
    diagnostic.push('🚫 AUSÊNCIA TOTAL DE SITE: A empresa depende 100% da visualização do Maps. Não possui landing page própria para captar leads ou apresentar catálogo/agendamentos.');
  } else if (lead.website_type === 'social_or_linktree') {
    diagnostic.push('📱 APENAS AGREGADOR / REDE SOCIAL: Redireciona potenciais compradores do Google para Linktree ou Instagram, onde o cliente se distrai com notificações e concorrentes.');
  } else {
    if (!lead.has_ssl) {
      diagnostic.push('🔒 FALTA DE CERTIFICADO SSL: Navegadores (Chrome/Safari) exibem aviso vermelho "NÃO SEGURO", gerando desconfiança imediata no consumidor.');
    }
    if (!lead.is_responsive) {
      diagnostic.push('📱 NÃO RESPONSIVO EM SMARTPHONES: O site não possui viewport mobile adequado, forçando o cliente a dar zoom manual na tela pequena.');
    }
    if (lead.has_meta_pixel || lead.has_google_tags) {
      diagnostic.push('💸 DINHEIRO QUEIMADO EM ANÚNCIOS: A empresa tem tags de tráfego pago ativas, mas direciona visitantes para uma página lenta ou com falhas de conversão.');
    }
    if (lead.pagespeed_mobile_score && lead.pagespeed_mobile_score < 50) {
      diagnostic.push(`⚡ CARREGAMENTO LENTO (${lead.pagespeed_mobile_score}/100): Segundo o Google, sites com mais de 3s de abertura no 4G perdem mais de 53% dos acessos antes do primeiro clique.`);
    }
  }

  const immediateHook =
    lead.site_status === 'offline_or_expired'
      ? `Notei que o site oficial da ${lead.name} no Google Maps está com erro ao abrir no celular, e quem procura por vocês na região pode estar indo direto para o concorrente.`
      : lead.website_type === 'none' || lead.website_type === 'social_or_linktree'
      ? `A ${lead.name} tem uma ótima reputação no Google (${lead.rating} estrelas), mas hoje perde clientes diários por não ter uma página rápida de 1-clique para agendamento/pedidos.`
      : !lead.has_ssl
      ? `O site de vocês está aparecendo como "Não Seguro" no Chrome do celular para clientes locais que procuram no Google.`
      : `Vocês já investem na presença digital da marca, mas o tempo de abertura do site no celular está gerando atrito para quem tenta contato.`;

  const objections: ObjectionScript[] = [
    {
      objection: 'Já temos Instagram, não precisamos de site.',
      contextWhy: 'Mais de 80% das buscas com intenção de compra imediata ocorrem no Google Maps e busca orgânica, não no feed do Instagram.',
      recommendedReply:
        `"O Instagram é excelente para quem já conhece vocês, mas quando alguém na região precisa de ${lead.category || 'serviços'} AGORA no Google, o Instagram não indexa nem facilita o agendamento direto. Uma página rápida fecha o cliente em 10 segundos antes dele fechar a aba."`,
      proofAngle: 'Clientes do Google têm intenção de compra no mesmo dia; seguidores de Instagram estão no momento de entretenimento.',
    },
    {
      objection: 'Nosso conhecido / sobrinho / equipe interna cuida do site.',
      contextWhy: 'Geralmente sites feitos sem foco em conversão mobile ficam abandonados sem manutenção técnica de velocidade ou SSL.',
      recommendedReply:
        `"Com certeza, ter apoio é fundamental! A nossa proposta não é substituir ninguém, e sim entregar uma auditoria técnica de alta performance para que a página de vocês converta o dobro de contatos que chegam pelo Maps."`,
      proofAngle: 'Foco em métricas reais de conversão e velocidade PageSpeed oficial do Google.',
    },
    {
      objection: 'Não temos tempo para mexer nisso agora.',
      contextWhy: 'O cliente tem medo de processos longos e reuniões intermináveis.',
      recommendedReply:
        `"Exatamente por saber que a rotina da ${lead.name} é corrida que nós cuidamos de 100% da parte pesada. Vocês só precisam aprovar o resultado final pronto em 48h sem parar a sua operação."`,
      proofAngle: 'Implementação Turnkey com zero trabalho operacional para o empresário.',
    },
    {
      objection: 'Criar ou reformar site é muito caro.',
      contextWhy: 'A empresa enxerga site como custo estético em vez de canal de retorno sobre o investimento (ROI).',
      recommendedReply:
        `"Se você recuperar apenas 2 ou 3 clientes que hoje desistem ao encontrar o perfil sem página própria no Google, o projeto já se paga no primeiro mês. O custo real é o cliente que liga para o vizinho porque não achou o botão de WhatsApp direto."`,
      proofAngle: 'Cálculo de retorno imediato sobre clientes perdidos por dia.',
    },
  ];

  return {
    executiveDiagnostic: diagnostic,
    immediateHook,
    objections,
  };
}
