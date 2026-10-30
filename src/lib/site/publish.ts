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
