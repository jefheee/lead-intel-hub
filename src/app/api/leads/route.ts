import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/db';

export async function GET() {
  try {
    const leads = await getLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao buscar leads' },
      { status: 500 }
    );
  }
}
