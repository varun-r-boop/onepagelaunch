import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSiteData } from '@/lib/site/types';
import { hasWaitlist, liveSiteOf } from '@/lib/site/publish';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Database setup problems the page owner has to fix (not the visitor)
type SetupProblem = 'setup_needed' | 'access_needed';

function setupProblem(error: { code?: string; message?: string }): SetupProblem | null {
  const message = error.message ?? '';
  // Table missing: 42P01 from Postgres, PGRST205 from the Data API
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(message)) return 'setup_needed';
  // No grant on the table, or a row-level security rule rejected the row
  if (error.code === '42501' || /permission denied|row-level security/i.test(message)) return 'access_needed';
  return null;
}

const SETUP_HINTS: Record<SetupProblem, string> = {
  setup_needed: 'The waitlist_signups table is missing. Run supabase/migrations/20261030000000_waitlist_signups.sql and 20261101000000_waitlist_grants.sql in the Supabase SQL editor.',
  access_needed: 'The API is not allowed to use waitlist_signups. Run supabase/migrations/20261101000000_waitlist_grants.sql in the Supabase SQL editor.',
};
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

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
  return entry.count > MAX_PER_WINDOW;
}

// POST { slug, email, website } — a visitor joins a page's waitlist.
// `website` is a hidden field: real people leave it empty, bots fill it in.
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a minute.' }, { status: 429 });
  }

  let body: { slug?: unknown; email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ success: true });
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!slug || !EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: project } = await supabase.from('projects').select('id, data').eq('slug', slug).single();
  const live = project && isSiteData(project.data) ? liveSiteOf(project.data) : null;
  if (!project || !live || !hasWaitlist(live)) {
    return NextResponse.json({ error: 'This page isn’t accepting sign-ups.' }, { status: 404 });
  }

  const { error } = await supabase.from('waitlist_signups').insert({ project_id: project.id, email });
  if (error) {
    // Already signed up counts as success
    if (error.code === '23505') return NextResponse.json({ success: true, already: true });
    const problem = setupProblem(error);
    console.error('Error saving waitlist signup:', error, problem ? `\nFix: ${SETUP_HINTS[problem]}` : '');
    if (problem) {
      // Retrying won't help the visitor; the page owner has to finish the setup
      return NextResponse.json({ error: 'This page isn’t accepting sign-ups right now. Please check back later.', reason: problem }, { status: 503 });
    }
    return NextResponse.json({ error: 'Couldn’t save your email. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// GET ?projectId=… — the page owner's sign-ups, newest first
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single();
  if (!project) return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });

  const { data, error } = await supabase
    .from('waitlist_signups')
    .select('email, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) {
    const problem = setupProblem(error);
    console.error('Error loading waitlist:', error, problem ? `\nFix: ${SETUP_HINTS[problem]}` : '');
    return NextResponse.json({ error: problem ?? 'Failed to load sign-ups' }, { status: 500 });
  }
  return NextResponse.json({ signups: data });
}
