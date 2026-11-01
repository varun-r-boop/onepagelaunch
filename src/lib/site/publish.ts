import type { SiteData } from './types';

// The version of a page that visitors see. Pages saved before drafts existed
// have no `publishedSite` and are always live; `null` means never published.
export function liveSiteOf(site: SiteData): SiteData | null {
  if (site.publishedSite === undefined) return site;
  return site.publishedSite;
}

// The draft without its published copy, for snapshotting and comparing
export function draftOf(site: SiteData): SiteData {
  const { publishedSite: _published, ...draft } = site;
  void _published;
  return draft;
}

export function hasWaitlist(site: SiteData): boolean {
  return site.sections.some(s => (s.type === 'hero' || s.type === 'cta') && s.waitlist);
}

// Key-order-independent JSON, since Postgres jsonb doesn't keep the order objects were written in
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

// Whether two versions of a page show the same content. Ignores the address
// (stored outside the draft) and the published copy.
export function sameContent(a: SiteData, b: SiteData): boolean {
  const comparable = (site: SiteData) => stableStringify({ ...draftOf(site), slug: undefined });
  return comparable(a) === comparable(b);
}
