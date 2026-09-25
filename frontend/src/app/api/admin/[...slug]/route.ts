import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const backendHost = process.env.INTERNAL_API_HOST || '127.0.0.1';
const backendPort = process.env.INTERNAL_API_PORT || '8080';
const secretKey = process.env.API_SECRET_KEY || 'dev-insecure-secret-key';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const path = (params.slug || []).join('/');
  const search = req.nextUrl.search;
  const targetUrl = `http://${backendHost}:${backendPort}/api/admin/${path}${search}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'X-API-Key': secretKey,
      },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
        'X-API-Key': secretKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend unreachable';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
