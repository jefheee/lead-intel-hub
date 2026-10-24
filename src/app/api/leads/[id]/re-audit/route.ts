import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead } from '@/lib/db';
import { auditWebsite } from '@/services/website-auditor';
import { calculateOpportunityScore } from '@/services/scoring-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Executa auditoria fresca no website
    const audit = await auditWebsite(lead.raw_website);

    // Recalcula a pontuação com as novas descobertas
    const scoring = calculateOpportunityScore({
      rating: lead.rating,
      reviews_count: lead.reviews_count,
      website_type: audit.website_type,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      whatsapp_link: lead.whatsapp_link,
      phone: lead.phone,
    });

    const updated = await updateLead(id, {
      website_type: audit.website_type,
      audit_status: audit.audit_status,
      has_ssl: audit.has_ssl,
      is_responsive: audit.is_responsive,
      cms_or_stack: audit.cms_or_stack,
      has_meta_pixel: audit.has_meta_pixel,
      has_google_tags: audit.has_google_tags,
      extracted_emails: audit.extracted_emails,
      social_links: audit.social_links,
      pagespeed_mobile_score: audit.pagespeed_mobile_score,
      opportunity_score: scoring.score,
      opportunity_tags: scoring.tags,
    });

    return NextResponse.json({ lead: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha na re-auditoria' },
      { status: 500 }
    );
  }
}
