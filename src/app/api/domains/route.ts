import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlan } from '@/lib/plans-server';
import { isAppHost } from '@/lib/app-hosts';
import { addDomain, domainStatus, domainsConfigured, isValidDomain, normalizeDomain, removeDomain } from '@/lib/vercel-domains';

async function ownedProject(projectId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) } as const;
  if (!projectId) return { error: NextResponse.json({ error: 'Project ID is required' }, { status: 400 }) } as const;
  // All columns, so this works before the custom_domain column exists
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).maybeSingle();
  if (!project) return { error: NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 }) } as const;
  return { supabase, user, project } as const;
}

function notConfigured() {
  console.error('Custom domains are not configured: set VERCEL_API_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for team projects).');
  return NextResponse.json({ error: 'Custom domains aren’t available yet. Please try again later.' }, { status: 503 });
}

// GET ?projectId=… -> { domain, status, records }
export async function GET(request: NextRequest) {
  const owned = await ownedProject(request.nextUrl.searchParams.get('projectId'));
  if ('error' in owned) return owned.error;
  const domain: string | null = owned.project.custom_domain ?? null;
  if (!domain) return NextResponse.json({ domain: null });
  if (!domainsConfigured()) return notConfigured();
  const { status, records } = await domainStatus(domain);
  return NextResponse.json({ domain, status, records });
}

// POST { projectId, domain } -> connects the domain (Pro only)
export async function POST(request: NextRequest) {
  let body: { projectId?: string; domain?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const owned = await ownedProject(body.projectId ?? null);
  if ('error' in owned) return owned.error;
  const { supabase, user, project } = owned;

  if ((await getPlan(supabase, user.id)) !== 'pro') {
    return NextResponse.json({ error: 'Custom domains are a Pro feature.' }, { status: 402 });
  }
  if (!domainsConfigured()) return notConfigured();

  const domain = normalizeDomain(body.domain ?? '');
  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: 'Enter a domain like yourproduct.com or www.yourproduct.com.' }, { status: 400 });
  }
  if (isAppHost(domain)) {
    return NextResponse.json({ error: 'That domain can’t be used. Use a domain you own.' }, { status: 400 });
  }

  const { data: taken } = await supabase.from('projects').select('id').eq('custom_domain', domain).neq('id', project.id).maybeSingle();
  if (taken) return NextResponse.json({ error: 'This domain is already connected to another page.' }, { status: 409 });

  const added = await addDomain(domain);
  if (!added.ok) return NextResponse.json({ error: added.message }, { status: 409 });

  // Replacing a previous domain: disconnect the old one
  if (project.custom_domain && project.custom_domain !== domain) await removeDomain(project.custom_domain);

  const { error } = await supabase.from('projects').update({ custom_domain: domain }).eq('id', project.id);
  if (error) {
    console.error('Error saving custom domain:', { code: error.code, message: error.message });
    const setup = error.code === '42703' || /custom_domain/.test(error.message);
    return NextResponse.json({ error: setup ? 'Custom domains aren’t set up in the database yet.' : 'Couldn’t save the domain. Please try again.' }, { status: 500 });
  }

  const { status, records } = await domainStatus(domain);
  return NextResponse.json({ domain, status, records });
}

// DELETE ?projectId=… -> disconnects the domain
export async function DELETE(request: NextRequest) {
  const owned = await ownedProject(request.nextUrl.searchParams.get('projectId'));
  if ('error' in owned) return owned.error;
  const domain: string | null = owned.project.custom_domain ?? null;
  if (domain && domainsConfigured()) await removeDomain(domain);
  await owned.supabase.from('projects').update({ custom_domain: null }).eq('id', owned.project.id);
  return NextResponse.json({ domain: null });
}
