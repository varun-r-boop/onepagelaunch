import type {
  BentoTile, FaqItem, PricingPlan, Section, SectionType, SiteLink, Testimonial, TileKind,
} from './types';

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const link = (label: string, url = '#'): SiteLink => ({ id: uid('link'), label, url });

export function newTile(kind: TileKind = 'feature', overrides: Partial<BentoTile> = {}): BentoTile {
  const defaults: Record<TileKind, Omit<BentoTile, 'id'>> = {
    feature: { kind: 'feature', size: 'sm', icon: 'sparkles', title: 'New feature', body: 'Describe what it does in one short sentence.' },
    stat: { kind: 'stat', size: 'sm', title: '99.9%', body: 'Uptime across all regions' },
    image: { kind: 'image', size: 'wide', title: 'Product screenshot', body: '', imageUrl: '' },
    quote: { kind: 'quote', size: 'wide', title: 'Jane Doe, Founder', body: '“This replaced three tools for us on day one.”' },
    link: { kind: 'link', size: 'sm', icon: 'github', title: 'GitHub', body: 'Star the repo', url: 'https://github.com' },
  };
  return { id: uid('tile'), ...defaults[kind], ...overrides };
}

export const newPlan = (overrides: Partial<PricingPlan> = {}): PricingPlan => ({
  id: uid('plan'),
  name: 'Plan',
  price: '$9',
  period: '/mo',
  description: 'For growing teams',
  features: ['Everything in Free', 'Priority support'],
  cta: link('Get started'),
  ...overrides,
});

export const newTestimonial = (overrides: Partial<Testimonial> = {}): Testimonial => ({
  id: uid('quote'),
  quote: '“It just works. We shipped our launch page in an afternoon.”',
  name: 'Alex Rivera',
  role: 'CTO, Northwind',
  ...overrides,
});

export const newFaq = (overrides: Partial<FaqItem> = {}): FaqItem => ({
  id: uid('faq'),
  question: 'New question?',
  answer: 'Write a short, helpful answer.',
  ...overrides,
});

// Default content for each section type when added from the picker
export function createSection(type: SectionType, name = 'Acme'): Section {
  const id = uid(type);
  switch (type) {
    case 'navbar':
      return { id, type, logo: name, links: [link('Features', '#features'), link('Pricing', '#pricing'), link('FAQ', '#faq')], cta: link('Get started') };
    case 'hero':
      return {
        id, type,
        badge: 'New · Now in public beta',
        title: `${name} helps you ship faster`,
        subtitle: 'One sentence that explains who it is for and the outcome they get. Keep it short and specific.',
        primary: link('Start for free'),
        secondary: link('Book a demo'),
        showSecondary: true,
        align: 'center',
        imageUrl: '',
      };
    case 'logos':
      return { id, type, title: 'Trusted by teams at', logos: ['Northwind', 'Globex', 'Initech', 'Umbrella', 'Hooli'].map(l => link(l)) };
    case 'bento':
      return {
        id, type,
        eyebrow: 'Features',
        title: 'Everything you need, nothing you don’t',
        subtitle: 'Arrange tiles to tell your product story.',
        tiles: [
          newTile('feature', { size: 'lg', icon: 'zap', title: 'Blazing fast', body: 'Sub-50ms responses on every request, everywhere in the world.' }),
          newTile('feature', { icon: 'shield', title: 'Secure by default', body: 'SOC 2 ready with encryption at rest.' }),
          newTile('stat', { title: '10k+', body: 'Teams onboarded' }),
          newTile('feature', { size: 'wide', icon: 'workflow', title: 'Automations', body: 'Connect the tools you already use without writing glue code.' }),
        ],
      };
    case 'pricing':
      return {
        id, type,
        title: 'Simple, transparent pricing',
        subtitle: 'Start free. Upgrade when you grow.',
        plans: [
          newPlan({ name: 'Free', price: '$0', period: '/mo', description: 'For side projects', features: ['1 project', 'Community support', 'Basic analytics'], cta: link('Start free') }),
          newPlan({ name: 'Pro', price: '$19', period: '/mo', description: 'For growing products', features: ['Unlimited projects', 'Custom domain', 'Advanced analytics', 'Priority support'], cta: link('Upgrade to Pro'), highlighted: true }),
          newPlan({ name: 'Team', price: '$49', period: '/mo', description: 'For companies', features: ['Everything in Pro', 'SSO & roles', 'Dedicated support'], cta: link('Contact sales') }),
        ],
      };
    case 'testimonials':
      return {
        id, type,
        title: 'Loved by builders',
        items: [
          newTestimonial(),
          newTestimonial({ quote: '“The cleanest onboarding I’ve seen. Our activation rate doubled.”', name: 'Priya Shah', role: 'Head of Growth, Globex' }),
          newTestimonial({ quote: '“Finally, a tool my whole team actually enjoys using.”', name: 'Sam Lee', role: 'Founder, Initech' }),
        ],
      };
    case 'faq':
      return {
        id, type,
        title: 'Frequently asked questions',
        items: [
          newFaq({ question: 'Is there a free plan?', answer: 'Yes. The free plan is free forever and includes everything you need to get started.' }),
          newFaq({ question: 'Can I cancel anytime?', answer: 'Absolutely. Cancel with one click from your settings, no questions asked.' }),
          newFaq({ question: 'Do you offer support?', answer: 'Every plan includes email support. Pro and Team get priority responses.' }),
        ],
      };
    case 'cta':
      return { id, type, title: 'Ready to get started?', subtitle: 'Join thousands of teams building with ' + name + '.', button: link('Start for free') };
    case 'footer':
      return { id, type, text: `© ${new Date().getFullYear()} ${name}. All rights reserved.`, links: [link('Twitter', 'https://x.com'), link('GitHub', 'https://github.com'), link('Contact', 'mailto:hello@example.com')] };
  }
}

export const SECTION_CATALOG: { type: SectionType; label: string; description: string }[] = [
  { type: 'navbar', label: 'Navigation', description: 'Logo, links and a button' },
  { type: 'hero', label: 'Hero', description: 'Big headline with call to action' },
  { type: 'logos', label: 'Logo cloud', description: 'Social proof from customers' },
  { type: 'bento', label: 'Bento grid', description: 'Features, stats, images & links in tiles' },
  { type: 'testimonials', label: 'Testimonials', description: 'Quotes from happy users' },
  { type: 'pricing', label: 'Pricing', description: 'Plans side by side' },
  { type: 'faq', label: 'FAQ', description: 'Answer common questions' },
  { type: 'cta', label: 'Call to action', description: 'A final push to sign up' },
  { type: 'footer', label: 'Footer', description: 'Copyright and links' },
];

export function sectionLabel(type: SectionType): string {
  return SECTION_CATALOG.find(s => s.type === type)?.label ?? type;
}

// Deep copy with fresh ids so duplicated sections don't share keys
export function cloneWithNewIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneWithNewIds) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === 'id' && typeof v === 'string' ? uid(v.split('-')[0]) : cloneWithNewIds(v);
    }
    return out as T;
  }
  return value;
}
