import { NextResponse } from 'next/server';
import { parseHealth } from '@/lib/health';

export async function GET() {
  try {
    const base = process.env.API_BASE_URL ?? 'http://127.0.0.1:8080';
    const response = await fetch(`${base}/api/v1/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const health = parseHealth(await response.json());
    if (!response.ok || health.status !== 'up' || health.database !== 'up') throw new Error('Unavailable');
    return NextResponse.json(health);
  } catch {
    return NextResponse.json({ status: 'down', database: 'down', mode: 'local' }, { status: 503 });
  }
}
