import { NextResponse } from 'next/server';
import { ensureScraperRunning } from '@/services/docker-manager';

export async function POST() {
  try {
    const result = await ensureScraperRunning();
    return NextResponse.json(result, { status: result.online ? 200 : 503 });
  } catch (error: any) {
    return NextResponse.json(
      { online: false, error: error?.message || 'Falha ao iniciar motor Docker' },
      { status: 500 }
    );
  }
}
