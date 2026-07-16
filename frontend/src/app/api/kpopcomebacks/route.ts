import { API_KPOP } from '@/lib/consts/urls';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return missingBaseUrlResponse();
  }
  const upstreamUrl = new URL(`${baseUrl}${API_KPOP}`);
  upstreamUrl.search = request.nextUrl.search;
  return forwardRequest(upstreamUrl, 'GET');
}

export async function POST(request: NextRequest) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return missingBaseUrlResponse();
  }

  const upstreamUrl = new URL(`${baseUrl}${API_KPOP}/query`);
  const body = await request.text();

  return forwardRequest(upstreamUrl, 'POST', body);
}

async function forwardRequest(
  upstreamUrl: URL,
  method: 'GET' | 'POST',
  body?: string
) {
  const response = await fetch(upstreamUrl.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'Content-Type':
        response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function getBaseUrl() {
  return process.env.BASE_URL;
}

function missingBaseUrlResponse() {
  return NextResponse.json({ error: 'missing_base_url' }, { status: 500 });
}
