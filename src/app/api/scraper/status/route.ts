import { NextResponse } from 'next/server';
import { checkScraperHealth } from '@/services/scraper-bridge';

export async function GET() {
  const health = await checkScraperHealth();
  return NextResponse.json(health);
}
