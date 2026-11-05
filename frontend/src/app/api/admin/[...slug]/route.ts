import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const backendHost = process.env.INTERNAL_API_HOST || '127.0.0.1';
const backendPort = process.env.INTERNAL_API_PORT || '8080';
const secretKey = process.env.API_SECRET_KEY || 'dev-insecure-secret-key';

// Relays the backend response, tolerating non-JSON bodies (e.g. plain-text 500s from uvicorn)
async function relay(res: Response): Promise<NextResponse> {
  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json(
      { error: text || `Backend responded with HTTP ${res.status}` },
      { status: res.status }
    );
  }
}

function forwardedHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    'X-API-Key': secretKey,
  };
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    headers['X-Forwarded-For'] = forwardedFor;
  }
  return headers;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const path = (params.slug || []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = `http://${backendHost}:${backendPort}/api/admin/${path}${search}`;

  try {
    const res = await fetch(targetUrl, {
      headers: forwardedHeaders(req),
      cache: 'no-store',
    });
    return await relay(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend unreachable';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const path = (params.slug || []).join('/');
  const targetUrl = `http://${backendHost}:${backendPort}/api/admin/${path}`;

  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardedHeaders(req) },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return await relay(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend unreachable';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
