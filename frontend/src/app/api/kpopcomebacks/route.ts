import { API_KPOP } from '@/lib/consts/urls';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE_URL = process.env.BASE_URL;

export async function GET(request: NextRequest) {
  if (!BASE_URL) {
    return NextResponse.json(
      { error: 'missing_base_url' },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL(`${BASE_URL}${API_KPOP}`);
  upstreamUrl.search = request.nextUrl.search;

  const response = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
