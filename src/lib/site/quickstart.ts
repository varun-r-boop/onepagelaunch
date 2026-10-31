import { createSection } from './sections';
import { getTemplate } from './templates';
import type { Section, SectionType, SiteData, SiteLink } from './types';

// The few answers the setup wizard asks for. Everything else is generated.
export interface QuickStartInfo {
  name: string;
  headline: string;
  description: string;
  // What the main button does: collect emails, or open a link
  goal: 'waitlist' | 'link';
  link: string;
}

export interface QuickStartChoices {
  templateId: string;
  accent: string;
  include: SectionType[];
}

// Sections the user can switch on or off. Navbar, hero, CTA and footer are always included.
export const OPTIONAL_SECTIONS: { type: SectionType; label: string; hint: string }[] = [
  { type: 'bento', label: 'Features', hint: 'Bento grid of what it does' },
  { type: 'pricing', label: 'Pricing', hint: 'Plans and prices' },
  { type: 'faq', label: 'FAQ', hint: 'Common questions' },
  { type: 'testimonials', label: 'Testimonials', hint: 'Add when you have real quotes' },
  { type: 'logos', label: 'Customer logos', hint: 'Add when you have real customers' },
];

export const DEFAULT_INCLUDE: SectionType[] = ['bento', 'pricing', 'faq'];

const ANCHORS: Partial<Record<SectionType, string>> = { bento: 'features', pricing: 'pricing', faq: 'faq' };
const NAV_LABELS: Partial<Record<SectionType, string>> = { bento: 'Features', pricing: 'Pricing', faq: 'FAQ' };

// Where an optional section goes if the template doesn't have it
const ORDER: SectionType[] = ['navbar', 'hero', 'logos', 'bento', 'testimonials', 'pricing', 'faq', 'cta', 'footer'];

function withUrl(link: SiteLink, url: string): SiteLink {
  return url ? { ...link, url } : link;
}

export function normalizeLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  return /^(https?:|mailto:|#|\/)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function buildQuickStartSite(info: QuickStartInfo, choices: QuickStartChoices, base: Pick<SiteData, 'projectName' | 'slug'>): SiteData {
  const template = getTemplate(choices.templateId);
  const name = info.name.trim() || 'Acme';
  const waitlist = info.goal === 'waitlist';
  // Waitlist pages send every button back up to the sign-up form
  const link = waitlist ? '#' : normalizeLink(info.link);

  // Start from the template, drop excluded sections, add included ones it lacks
  let sections = template.build(name).filter(s => {
    const optional = OPTIONAL_SECTIONS.some(o => o.type === s.type);
    return !optional || choices.include.includes(s.type);
  });
  for (const type of choices.include) {
    if (sections.some(s => s.type === type)) continue;
    const at = sections.findIndex(s => ORDER.indexOf(s.type) > ORDER.indexOf(type));
    const created = createSection(type, name);
    const section = { ...created, id: ANCHORS[type] ?? created.id } as Section;
    sections = at === -1 ? [...sections, section] : [...sections.slice(0, at), section, ...sections.slice(at)];
  }

  // Fill in the user's own words and link everywhere they belong
  sections = sections.map((section): Section => {
    switch (section.type) {
      case 'navbar': {
        // Nav links only point at sections that exist
        const navLinks = choices.include
          .filter(t => NAV_LABELS[t])
          .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
          .map(t => ({ id: `nav-${t}`, label: NAV_LABELS[t]!, url: `#${ANCHORS[t]}` }));
        const cta = waitlist ? { ...section.cta, label: 'Join waitlist', url: '#' } : withUrl(section.cta, link);
        return { ...section, logo: name, links: section.links.length ? navLinks : [], cta };
      }
      case 'hero':
        return {
          ...section,
          title: info.headline.trim() || section.title,
          subtitle: info.description.trim() || section.subtitle,
          primary: waitlist ? { ...section.primary, label: 'Join the waitlist', url: '#' } : withUrl(section.primary, link),
          // One clear call to action; a second button can be switched on in the editor
          showSecondary: false,
          waitlist,
          badge: waitlist ? 'Coming soon' : section.badge,
        };
      case 'pricing':
        return { ...section, plans: section.plans.map(p => ({ ...p, cta: withUrl(p.cta, link) })) };
      case 'cta':
        return waitlist
          ? { ...section, title: 'Be the first to know', subtitle: `Join the waitlist and get early access to ${name}.`, button: { ...section.button, label: 'Join the waitlist' }, waitlist }
          : { ...section, button: withUrl(section.button, link) };
      default:
        return section;
    }
  });

  return {
    version: 2,
    // The product name also becomes the page's name (browser tab, dashboard)
    projectName: name,
    slug: base.slug,
    template: template.id,
    theme: { ...template.theme, accent: choices.accent },
    sections,
  };
}

// Reads the wizard answers back out of an existing page so it can be restyled without retyping
export function infoFromSite(site: SiteData): QuickStartInfo {
  const nav = site.sections.find(s => s.type === 'navbar');
  const hero = site.sections.find(s => s.type === 'hero');
  const fallbackName = site.projectName.replace(/'s Page$/i, '');
  return {
    name: nav?.type === 'navbar' ? nav.logo : fallbackName,
    headline: hero?.type === 'hero' ? hero.title : '',
    description: hero?.type === 'hero' ? hero.subtitle : '',
    goal: hero?.type === 'hero' && hero.waitlist ? 'waitlist' : 'link',
    link: hero?.type === 'hero' && hero.primary.url !== '#' ? hero.primary.url : '',
  };
}

function brandOf(site: SiteData): string {
  const nav = site.sections.find(s => s.type === 'navbar');
  return nav?.type === 'navbar' ? nav.logo : site.projectName;
}

// Switches an optional section on or off. `restore` brings back a section the
// user removed earlier, edits included. Nav links follow the sections.
export function setSectionEnabled(site: SiteData, type: SectionType, on: boolean, restore?: Section): SiteData {
  let sections = site.sections;
  const anchor = ANCHORS[type];
  if (on) {
    if (sections.some(s => s.type === type)) return site;
    const created = restore ?? createSection(type, brandOf(site));
    const section = { ...created, id: anchor ?? created.id } as Section;
    const at = sections.findIndex(s => ORDER.indexOf(s.type) > ORDER.indexOf(type));
    sections = at === -1 ? [...sections, section] : [...sections.slice(0, at), section, ...sections.slice(at)];
  } else {
    sections = sections.filter(s => s.type !== type);
  }

  // Keep the nav in sync (only on navbars that show section links)
  const label = NAV_LABELS[type];
  if (anchor && label) {
    sections = sections.map(s => {
      if (s.type !== 'navbar' || s.links.length === 0 && on) return s;
      const others = s.links.filter(l => l.url !== `#${anchor}`);
      if (!on) return { ...s, links: others };
      const links = [...others, { id: `nav-${type}`, label, url: `#${anchor}` }].sort((a, b) => {
        const rank = (url: string) => {
          const t = (Object.keys(ANCHORS) as SectionType[]).find(k => `#${ANCHORS[k]}` === url);
          return t ? ORDER.indexOf(t) : 99;
        };
        return rank(a.url) - rank(b.url);
      });
      return { ...s, links };
    });
  }
  return { ...site, sections };
}
