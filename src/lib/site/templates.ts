import { createSection, link, newTile } from './sections';
import type { BentoSection, HeroSection, NavbarSection, Section, SiteData, SiteTheme } from './types';

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  theme: SiteTheme;
  build: (name: string) => Section[];
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: 'launch',
    name: 'Launch',
    description: 'The classic SaaS landing page: hero, bento features, pricing and FAQ.',
    theme: { preset: 'light', accent: '#4f46e5', font: 'inter', radius: 'rounded' },
    build: name => [
      createSection('navbar', name),
      createSection('hero', name),
      createSection('logos', name),
      { ...createSection('bento', name), id: 'features' } as BentoSection,
      createSection('testimonials', name),
      { ...createSection('pricing', name), id: 'pricing' },
      { ...createSection('faq', name), id: 'faq' },
      createSection('cta', name),
      createSection('footer', name),
    ],
  },
  {
    id: 'bento',
    name: 'Bento',
    description: 'A dark, tile-first page. Great for dev tools and indie products.',
    theme: { preset: 'midnight', accent: '#818cf8', font: 'grotesk', radius: 'soft' },
    build: name => {
      const nav = createSection('navbar', name) as NavbarSection;
      const hero = createSection('hero', name) as HeroSection;
      const bento = createSection('bento', name) as BentoSection;
      return [
        { ...nav, links: [link('Features', '#features'), link('Changelog', '#'), link('Docs', '#')], cta: link('Sign in') },
        { ...hero, align: 'left', badge: 'v1.0 is live →', title: `Meet ${name}. The toolkit for modern builders.`, primary: link('Get started'), secondary: link('Star on GitHub', 'https://github.com') },
        {
          ...bento,
          id: 'features',
          eyebrow: 'Why ' + name,
          title: 'Built for speed. Designed for focus.',
          subtitle: '',
          tiles: [
            newTile('feature', { size: 'lg', icon: 'terminal', title: 'CLI first', body: 'Install in one command and be productive in under a minute. Everything is scriptable.', accent: true }),
            newTile('stat', { title: '2.4ms', body: 'Median latency' }),
            newTile('feature', { icon: 'lock', title: 'Private by design', body: 'Your data never leaves your account.' }),
            newTile('quote', { size: 'wide', title: 'Maya Chen, Staff Engineer', body: '“We replaced a week of setup with a single config file.”' }),
            newTile('feature', { size: 'tall', icon: 'bot', title: 'AI assist', body: 'Smart suggestions that learn from your codebase and stay out of your way until you need them.' }),
            newTile('feature', { icon: 'puzzle', title: '50+ integrations', body: 'Slack, Linear, GitHub and more.' }),
            newTile('stat', { title: '12k', body: 'GitHub stars' }),
            newTile('link', { icon: 'github', title: 'GitHub', body: 'Read the source', url: 'https://github.com' }),
            newTile('link', { icon: 'twitter', title: 'Follow updates', body: '@' + name.toLowerCase().replace(/\s+/g, ''), url: 'https://x.com' }),
          ],
        },
        createSection('testimonials', name),
        createSection('cta', name),
        createSection('footer', name),
      ];
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Editorial and calm. A short page that gets straight to the point.',
    theme: { preset: 'cream', accent: '#ea580c', font: 'serif', radius: 'sharp' },
    build: name => {
      const hero = createSection('hero', name) as HeroSection;
      const bento = createSection('bento', name) as BentoSection;
      return [
        { ...(createSection('navbar', name) as NavbarSection), links: [] },
        { ...hero, badge: '', title: `${name} — the calm way to get work done`, showSecondary: false, primary: link('Join the waitlist') },
        {
          ...bento,
          id: 'features',
          eyebrow: '',
          title: 'Three reasons people switch',
          subtitle: '',
          tiles: [
            newTile('feature', { icon: 'clock', title: 'Saves hours', body: 'Automates the busywork so you can focus.' }),
            newTile('feature', { icon: 'heart', title: 'Feels good', body: 'Thoughtful details in every interaction.' }),
            newTile('feature', { icon: 'shield', title: 'Stays private', body: 'No tracking. No ads. Ever.' }),
          ],
        },
        { ...createSection('faq', name), id: 'faq' },
        createSection('cta', name),
        createSection('footer', name),
      ];
    },
  },
];

export function getTemplate(id: string): SiteTemplate {
  return SITE_TEMPLATES.find(t => t.id === id) ?? SITE_TEMPLATES[0];
}

export function createSiteFromTemplate(templateId: string, projectName: string, slug?: string): SiteData {
  const template = getTemplate(templateId);
  // Short product name for logos and headlines, e.g. "acme's Page" -> "Acme"
  const brand = projectName.replace(/'s Page$/i, '').trim() || 'Acme';
  const pretty = brand.charAt(0).toUpperCase() + brand.slice(1);
  return {
    version: 2,
    projectName,
    slug,
    template: template.id,
    theme: { ...template.theme },
    sections: template.build(pretty),
  };
}
