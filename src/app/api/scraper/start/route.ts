import { NextRequest, NextResponse } from 'next/server';
import { triggerScrapingPipeline } from '@/services/scraper-bridge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, depth, zoom, radius } = body;

    if (!query || !location) {
      return NextResponse.json(
        { error: 'Parâmetros "query" (nicho) e "location" (cidade/bairro) são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await triggerScrapingPipeline({
      query,
      location,
      depth: depth ? parseInt(depth, 10) : 5,
      zoom: zoom ? parseInt(zoom, 10) : 15,
      radius: radius ? parseInt(radius, 10) : 10000,
    });

    return NextResponse.json({
      success: true,
      job: result.job,
      total_found: result.leads.length,
      leads: result.leads,
    });
  } catch (error) {
    console.error('Error starting scrape:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha durante o processo de prospecção' },
      { status: 500 }
    );
  }
}
