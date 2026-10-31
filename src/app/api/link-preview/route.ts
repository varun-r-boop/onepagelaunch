import { NextRequest, NextResponse } from 'next/server';
import { extractUrls } from '@/lib/links/detect';
import { getLinkPreview } from '@/lib/links/fetch-preview';

export const runtime = 'nodejs';

const MAX_URLS = 12;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;

// Basic per-IP rate limit. In-memory, so it is per server instance.
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

// POST { text } or { urls } -> { previews }
// Turns pasted links into previews (title, image, stars, ...) for bento tiles.
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });
  }

  let body: { text?: unknown; urls?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text : Array.isArray(body.urls) ? body.urls.filter(u => typeof u === 'string').join('\n') : '';
  const urls = extractUrls(text.slice(0, 10_000)).slice(0, MAX_URLS);
  if (urls.length === 0) {
    return NextResponse.json({ error: 'No links found' }, { status: 400 });
  }

  const previews = await Promise.all(urls.map(getLinkPreview));
  return NextResponse.json({ previews });
}
