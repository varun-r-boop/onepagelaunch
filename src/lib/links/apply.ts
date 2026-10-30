import { socialLinkFromPreview, tileFromPreview, type LinkPreview } from './detect';
import type { BentoSection, Section, SiteData } from '@/lib/site/types';

export const LINKS_SECTION_ID = 'links';

// Footer links the templates ship with; replaced once the user adds real profiles
const PLACEHOLDER_URLS = new Set(['https://x.com', 'https://github.com', 'mailto:hello@example.com']);

export interface ApplyLinksResult {
  site: SiteData;
  tiles: number;
  socials: number;
}

function brandOf(site: SiteData): string {
  const nav = site.sections.find(s => s.type === 'navbar');
  return nav?.type === 'navbar' ? nav.logo : site.projectName.replace(/'s Page$/i, '');
}

function insertLinksSection(sections: Section[], section: BentoSection): Section[] {
  // After the last bento grid, else after the hero, else before the closing sections
  let at = -1;
  sections.forEach((s, i) => { if (s.type === 'bento') at = i + 1; });
  if (at === -1) {
    const hero = sections.findIndex(s => s.type === 'hero');
    if (hero !== -1) at = hero + 1;
  }
  if (at === -1) {
    const closing = sections.findIndex(s => s.type === 'cta' || s.type === 'footer');
    at = closing === -1 ? sections.length : closing;
  }
  return [...sections.slice(0, at), section, ...sections.slice(at)];
}

// Adds pasted links to the page: every link becomes a tile, and social profiles
// are also added to the footer. Tiles go into `sectionId` if given, otherwise
// into a "links" bento section that is created when missing.
export function applyLinksToSite(site: SiteData, previews: LinkPreview[], sectionId?: string): ApplyLinksResult {
  let sections = site.sections;
  const targetId =
    (sectionId && sections.some(s => s.id === sectionId && s.type === 'bento') && sectionId) ||
    (sections.some(s => s.id === LINKS_SECTION_ID && s.type === 'bento') && LINKS_SECTION_ID) ||
    null;

  // Skip repeats within the paste and links that already have a tile in the target grid
  const target = sections.find(s => s.id === targetId);
  const existingUrls = new Set(target?.type === 'bento' ? target.tiles.map(t => t.url) : []);
  const unique = previews.filter((p, i) => previews.findIndex(q => q.url === p.url) === i);
  const tiles = unique.filter(p => !existingUrls.has(p.url)).map(p => tileFromPreview(p));
  if (unique.length === 0) return { site, tiles: 0, socials: 0 };

  if (targetId) {
    sections = sections.map(s => (s.id === targetId && s.type === 'bento' ? { ...s, tiles: [...s.tiles, ...tiles] } : s));
  } else if (tiles.length) {
    sections = insertLinksSection(sections, {
      id: LINKS_SECTION_ID,
      type: 'bento',
      eyebrow: '',
      title: `More from ${brandOf(site)}`,
      subtitle: '',
      tiles,
    });
  }

  // Social profiles also belong in the footer
  const socials = unique.filter(p => p.kind === 'social');
  let addedSocials = 0;
  if (socials.length) {
    sections = sections.map(s => {
      if (s.type !== 'footer') return s;
      const existing = s.links.filter(l => !PLACEHOLDER_URLS.has(l.url));
      const fresh = socials.filter(p => !existing.some(l => l.url === p.url)).map(socialLinkFromPreview);
      addedSocials += fresh.length;
      return { ...s, links: [...existing, ...fresh] };
    });
  }

  return { site: { ...site, sections }, tiles: tiles.length, socials: addedSocials };
}

// When restyling with a new template, keep the links the user already added
export function carryOverLinks(previous: SiteData, next: SiteData): SiteData {
  const linksSection = previous.sections.find(s => s.id === LINKS_SECTION_ID && s.type === 'bento') as BentoSection | undefined;
  const prevFooter = previous.sections.find(s => s.type === 'footer');
  let sections = next.sections;
  if (linksSection && !sections.some(s => s.id === LINKS_SECTION_ID)) {
    sections = insertLinksSection(sections, linksSection);
  }
  if (prevFooter?.type === 'footer') {
    sections = sections.map(s => (s.type === 'footer' ? { ...s, links: prevFooter.links } : s));
  }
  return { ...next, sections };
}
