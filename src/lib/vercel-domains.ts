// Server-only: connects custom domains to this app's Vercel project.
// Env: VERCEL_API_TOKEN, VERCEL_PROJECT_ID, and VERCEL_TEAM_ID if the project belongs to a team.

const API = 'https://api.vercel.com';

export function domainsConfigured(): boolean {
  return !!(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function url(path: string): string {
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : '';
  return `${API}${path}${team}`;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: T & { error?: { code?: string; message?: string } } }> {
  const res = await fetch(url(path), {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json', ...init.headers },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

const project = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID!);

// "https://www.Acme.com/path" -> "www.acme.com"
export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '').replace(/\.$/, '');
}

export function isValidDomain(domain: string): boolean {
  return domain.length <= 253 && /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/.test(domain);
}

export interface DnsRecord { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string }

// The records the user adds at their DNS provider
export function dnsRecordsFor(domain: string, verification: { type: string; domain: string; value: string }[] = []): DnsRecord[] {
  const labels = domain.split('.');
  // Naive apex check; multi-part suffixes like .co.uk show the CNAME form, which still points the right way
  const apex = labels.length === 2;
  const records: DnsRecord[] = apex
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }]
    : [{ type: 'CNAME', name: labels.slice(0, -2).join('.'), value: 'cname.vercel-dns.com' }];
  // Vercel asks for a TXT record when the domain is already used elsewhere on Vercel
  for (const v of verification) {
    if (v.type === 'TXT') records.push({ type: 'TXT', name: v.domain.replace(`.${labels.slice(-2).join('.')}`, '') || '@', value: v.value });
  }
  return records;
}

export type DomainStatus = 'active' | 'pending';

interface ProjectDomain { name: string; verified: boolean; verification?: { type: string; domain: string; value: string }[] }

export async function addDomain(domain: string): Promise<{ ok: true; verification: ProjectDomain['verification'] } | { ok: false; message: string }> {
  const { ok, status, body } = await call<ProjectDomain>(`/v10/projects/${project()}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });
  if (ok) return { ok: true, verification: body.verification };
  // Already on this project: fine
  if (status === 409 && body.error?.code === 'domain_already_in_use') {
    return { ok: false, message: 'This domain is already connected to another Vercel project.' };
  }
  if (status === 409) return { ok: true, verification: [] };
  console.error('Vercel add domain failed:', status, body.error);
  return { ok: false, message: body.error?.message || 'Couldn’t connect the domain. Please try again.' };
}

export async function domainStatus(domain: string): Promise<{ status: DomainStatus; records: DnsRecord[] }> {
  const [info, config] = await Promise.all([
    call<ProjectDomain>(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`),
    call<{ misconfigured?: boolean }>(`/v6/domains/${encodeURIComponent(domain)}/config`),
  ]);
  let verified = info.ok && info.body.verified;
  if (info.ok && !verified) {
    // Ask Vercel to re-check the TXT record
    const check = await call<ProjectDomain>(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}/verify`, { method: 'POST' });
    verified = check.ok && check.body.verified;
  }
  const active = verified && config.ok && config.body.misconfigured === false;
  return { status: active ? 'active' : 'pending', records: dnsRecordsFor(domain, info.body.verification) };
}

export async function removeDomain(domain: string): Promise<void> {
  const { ok, status, body } = await call(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`, { method: 'DELETE' });
  if (!ok && status !== 404) console.error('Vercel remove domain failed:', status, body.error);
}
