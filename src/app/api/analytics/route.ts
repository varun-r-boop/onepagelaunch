import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getPlan } from '@/lib/plans-server';

export interface AnalyticsDay { date: string; views: number; visitors: number; signups: number }
export interface Analytics {
  days: AnalyticsDay[];
  totals: { views: number; visitors: number; signups: number; conversion: number | null };
  referrers: { source: string; visitors: number }[];
  countries: { country: string; visitors: number }[];
}

// GET ?projectId=…&days=30 — the owner's page analytics (Pro only)
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  const range = Math.min(Math.max(Number(request.nextUrl.searchParams.get('days')) || 30, 1), 90);
  if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).maybeSingle();
  if (!project) return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });

  if ((await getPlan(supabase, user.id)) !== 'pro') {
    return NextResponse.json({ error: 'pro_required' }, { status: 402 });
  }

  // Ownership is checked, so the secret key (if set) may read this page's rows
  const db = process.env.SUPABASE_SECRET_KEY ? createAdminClient() : supabase;
  const since = new Date(Date.now() - (range - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);

  const [{ data: views, error: viewsError }, { data: signups }] = await Promise.all([
    db.from('page_views').select('created_at, visitor_hash, referrer_host, country').eq('project_id', projectId).gte('created_at', since.toISOString()).limit(50_000),
    db.from('waitlist_signups').select('created_at').eq('project_id', projectId).gte('created_at', since.toISOString()).limit(50_000),
  ]);
  if (viewsError) {
    console.error('Error loading analytics:', { code: viewsError.code, message: viewsError.message });
    return NextResponse.json({ error: 'setup_needed' }, { status: 500 });
  }

  // One bucket per UTC day, oldest first
  const days = new Map<string, { views: number; visitors: Set<string>; signups: number }>();
  for (let i = 0; i < range; i++) {
    days.set(new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10), { views: 0, visitors: new Set(), signups: 0 });
  }
  const referrers = new Map<string, Set<string>>();
  const countries = new Map<string, Set<string>>();
  for (const v of views ?? []) {
    const day = days.get(String(v.created_at).slice(0, 10));
    if (day) { day.views += 1; day.visitors.add(v.visitor_hash); }
    // Visitor hashes rotate daily, so "visitors" is the sum of daily unique visitors
    const key = `${String(v.created_at).slice(0, 10)}|${v.visitor_hash}`;
    const source = v.referrer_host || 'Direct';
    if (!referrers.has(source)) referrers.set(source, new Set());
    referrers.get(source)!.add(key);
    if (v.country) {
      if (!countries.has(v.country)) countries.set(v.country, new Set());
      countries.get(v.country)!.add(key);
    }
  }
  for (const s of signups ?? []) {
    const day = days.get(String(s.created_at).slice(0, 10));
    if (day) day.signups += 1;
  }

  const series: AnalyticsDay[] = [...days].map(([date, d]) => ({ date, views: d.views, visitors: d.visitors.size, signups: d.signups }));
  const visitors = series.reduce((n, d) => n + d.visitors, 0);
  const signupTotal = series.reduce((n, d) => n + d.signups, 0);
  const top = (map: Map<string, Set<string>>, n: number) => [...map].map(([k, set]) => [k, set.size] as const).sort((a, b) => b[1] - a[1]).slice(0, n);

  const body: Analytics = {
    days: series,
    totals: {
      views: series.reduce((n, d) => n + d.views, 0),
      visitors,
      signups: signupTotal,
      conversion: visitors > 0 ? signupTotal / visitors : null,
    },
    referrers: top(referrers, 6).map(([source, count]) => ({ source, visitors: count })),
    countries: top(countries, 5).map(([country, count]) => ({ country, visitors: count })),
  };
  return NextResponse.json(body);
}
