import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isSiteData } from '@/lib/site/types';
import { liveSiteOf } from '@/lib/site/publish';

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|lighthouse|headless/i;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
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
  return entry.count > MAX_PER_WINDOW;
}

const ok = () => new NextResponse(null, { status: 204 });

// POST { slug, referrer } — records one view of a published page.
// Privacy-friendly: no cookies; IP and browser are only used for a hash that
// changes every day, so visitors can be counted but not followed.
export async function POST(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Views need the secret key (the table has no public insert rule); skip quietly without it
  if (!process.env.SUPABASE_SECRET_KEY || BOTS.test(ua) || rateLimited(ip)) return ok();

  let body: { slug?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return ok();
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  if (!slug) return ok();

  const db = createAdminClient();
  const { data: project } = await db.from('projects').select('id, user_id, data').eq('slug', slug).maybeSingle();
  if (!project || !isSiteData(project.data) || !liveSiteOf(project.data)) return ok();

  // Owners checking their own page don't count
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (user?.id === project.user_id) return ok();

  let referrerHost: string | null = null;
  if (typeof body.referrer === 'string' && body.referrer) {
    try {
      const host = new URL(body.referrer).hostname.replace(/^www\./, '');
      if (host && host !== request.nextUrl.hostname.replace(/^www\./, '')) referrerHost = host.slice(0, 100);
    } catch {
      // not a URL
    }
  }

  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHash('sha256').update(`${day}|${ip}|${ua}|${process.env.SUPABASE_SECRET_KEY}`).digest('hex').slice(0, 32);

  const { error } = await db.from('page_views').insert({
    project_id: project.id,
    visitor_hash: visitorHash,
    referrer_host: referrerHost,
    country: request.headers.get('x-vercel-ip-country')?.slice(0, 2) ?? null,
  });
  if (error) console.error('Error recording page view:', { code: error.code, message: error.message, details: error.details });
  return ok();
}
