import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAdminPath } from '@/lib/adminRoutes';

export const dynamic = 'force-dynamic';

const backendHost = process.env.INTERNAL_API_HOST || '127.0.0.1';
const backendPort = process.env.INTERNAL_API_PORT || '8080';
// Runs start in the background and answer at once, so only a stuck backend gets anywhere near this
const BACKEND_TIMEOUT_MS = 60_000;

type Context = { params: Promise<{ slug: string[] }> };

async function forward(req: NextRequest, { params }: Context, method: 'GET' | 'POST'): Promise<NextResponse> {
  const { slug = [] } = await params;
  if (!isAllowedAdminPath(method, slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const headers: Record<string, string> = {
    'X-API-Key': process.env.API_SECRET_KEY || 'dev-insecure-secret-key',
  };
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers['X-Forwarded-For'] = forwardedFor;
  if (method === 'POST') headers['Content-Type'] = 'application/json';

  const search = method === 'GET' ? req.nextUrl.search : '';
  try {
    const res = await fetch(`http://${backendHost}:${backendPort}/api/admin/${slug.join('/')}${search}`, {
      method,
      headers,
      body: method === 'POST' ? await req.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const body = await res.text();
    // Plain-text answers (a crash in uvicorn, say) still reach the client as the JSON it expects
    if (!res.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: body || `Backend responded with HTTP ${res.status}` }, { status: res.status });
    }
    return new NextResponse(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}

export function GET(req: NextRequest, context: Context) {
  return forward(req, context, 'GET');
}

export function POST(req: NextRequest, context: Context) {
  return forward(req, context, 'POST');
}
