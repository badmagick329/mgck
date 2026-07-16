import { API_KPOP } from '@/lib/consts/urls';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'missing_base_url' }, { status: 500 });
  }

  const upstreamUrl = new URL(`${baseUrl}${API_KPOP}/artists`);
  upstreamUrl.search = request.nextUrl.search;
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  });
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type':
        response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
