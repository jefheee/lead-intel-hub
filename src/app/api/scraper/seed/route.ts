import { NextResponse } from 'next/server';
import { seedSampleLeads } from '@/services/scraper-bridge';

export async function POST() {
  try {
    const leads = await seedSampleLeads();
    return NextResponse.json({
      success: true,
      message: 'Amostras de demonstração importadas e auditadas com sucesso!',
      leads,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao semear leads' },
      { status: 500 }
    );
  }
}
