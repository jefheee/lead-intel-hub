import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getLeadById, updateLead } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    // Preparar contexto rico para a geração
    const websiteContext =
      lead.website_type === 'none'
        ? 'Não possui nenhum site cadastrado no Google Maps (apenas o telefone/perfil do Maps).'
        : lead.website_type === 'social_or_linktree'
        ? `Não possui site institucional próprio, apenas link para rede social ou agregador: ${lead.raw_website}.`
        : `Possui domínio próprio (${lead.raw_website}). Diagnóstico: SSL ${
            lead.has_ssl ? 'Ativo' : 'AUSENTE/INSEGURO (HTTP)'
          }, Responsividade Mobile: ${lead.is_responsive ? 'OK' : 'RUIM/FALTA VIEWPORT'}, CMS: ${
            lead.cms_or_stack || 'Desconhecido'
          }, Pixel Meta: ${lead.has_meta_pixel ? 'Presente' : 'Não'}, Google Tags: ${
            lead.has_google_tags ? 'Presente' : 'Não'
          }, Performance Mobile PageSpeed: ${
            lead.pagespeed_mobile_score ? lead.pagespeed_mobile_score + '/100' : 'Não medido'
          }.`;

    const prompt = `Você é um consultor sênior de aceleração comercial e presença digital B2B.
Escreva uma mensagem de WhatsApp curta, direta, consultiva e de alto impacto para abordar o proprietário ou tomador de decisão da empresa abaixo.

REGRAS OBRIGATÓRIAS:
1. Mensagem de 2 a 3 parágrafos curtos (máximo 4 a 6 linhas no total), ideal para leitura rápida no WhatsApp.
2. NUNCA pareça um vendedor chato ou robô de spam ("Olá prezado, somos da agência X"). Fale como um profissional local que notou algo específico e genuíno sobre o negócio deles.
3. Elogie a reputação deles no Google Maps (mostre que pesquisou).
4. Aponte com delicadeza e precisão a oportunidade ou falha digital identificada (ex: ausência de landing page rápida para converter, ou site sem SSL/lento enquanto investem em anúncios).
5. Termine com uma chamada para ação (CTA) de baixo atrito (ex: "faz sentido eu te mandar um vídeo de 1 minuto mostrando como corrigir isso?" ou "posso compartilhar um comparativo rápido com você?").
6. Tom profissional, caloroso e brasileiro. Não use hashtags nem excesso de emojis (use no máximo 1 ou 2 sutis).

DADOS DO LEAD:
- Nome da Empresa: ${lead.name}
- Categoria / Nicho: ${lead.category || 'Empresa Local'}
- Bairro / Localização: ${lead.neighborhood || lead.city || 'região'}
- Prova Social: ${lead.rating} estrelas em ${lead.reviews_count} avaliações no Google Maps
- Diagnóstico Técnico do Site: ${websiteContext}
- Oportunidades Identificadas: ${lead.opportunity_tags.join(', ') || 'Melhoria de presença digital'}
`;

    let generatedPitch = '';

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é um especialista em prospecção B2B humanizada, focado em alta taxa de resposta no WhatsApp.',
          temperature: 0.7,
        },
      });

      generatedPitch = response.text || '';
    } else {
      // Fallback elegante com template dinâmico quando a chave GEMINI_API_KEY ainda não foi preenchida
      const rep = lead.reviews_count >= 30 ? `com nota ${lead.rating} e mais de ${lead.reviews_count} avaliações` : `com excelente reputação`;
      const problema =
        lead.website_type === 'none' || lead.website_type === 'social_or_linktree'
          ? `reparei que hoje vocês ainda não têm uma página oficial rápida com botão de agendamento/cardápio próprio`
          : !lead.has_ssl
          ? `notei que o site de vocês está acusando aviso de segurança (sem SSL) nos celulares dos clientes`
          : `vi que vocês investem na marca mas o carregamento do site no celular está gerando atrito para quem tenta contato`;

      generatedPitch = `Olá, tudo bem? Vi a ${lead.name} aqui no Maps ${rep} em ${lead.neighborhood || lead.city || 'nossa região'}.\n\nEstudando a presença digital de vocês, ${problema}, o que pode estar custando clientes qualificados que procuram no Google.\n\nFiz um diagnóstico rápido de 1 minuto em vídeo com a melhoria. Posso compartilhar com você por aqui?`;
    }

    // Atualiza o lead no banco com o pitch gerado
    const updated = await updateLead(id, { ai_pitch: generatedPitch });

    return NextResponse.json({
      pitch: generatedPitch,
      lead: updated,
      usedAi: Boolean(apiKey),
    });
  } catch (error) {
    console.error('Error in generate-pitch API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao gerar abordagem com IA' },
      { status: 500 }
    );
  }
}
