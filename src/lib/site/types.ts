// Site builder v2: a page is a list of pre-designed sections styled by one theme.
// Users edit text in place and pick from curated options instead of styling
// every block by hand.

export type ThemePreset = 'light' | 'dark' | 'midnight' | 'cream' | 'forest' | 'mono';
export type ThemeFont = 'inter' | 'grotesk' | 'serif' | 'mono';
export type ThemeRadius = 'sharp' | 'rounded' | 'soft';

export interface SiteTheme {
  // Older pages: a fixed palette. New pages set `background` and the rest is derived.
  preset: ThemePreset;
  // Primary color: buttons and highlights
  accent: string;
  // Secondary color: the page background. Text, cards and borders are derived from it.
  background?: string;
  font: ThemeFont;
  radius: ThemeRadius;
}

export interface SiteLink {
  id: string;
  label: string;
  url: string;
}

export type TileSize = 'sm' | 'wide' | 'tall' | 'lg';
export type TileKind = 'feature' | 'stat' | 'image' | 'quote' | 'link' | 'video';

export interface BentoTile {
  id: string;
  kind: TileKind;
  size: TileSize;
  icon?: string;
  title: string;
  body: string;
  imageUrl?: string;
  url?: string;
  accent?: boolean;
  // Filled in from a pasted link: player URL for video tiles, a logo/avatar,
  // and a small detail line such as "★ 12.4k · TypeScript"
  embedUrl?: string;
  iconUrl?: string;
  meta?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: SiteLink;
  highlighted?: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface NavbarSection {
  id: string;
  type: 'navbar';
  logo: string;
  links: SiteLink[];
  cta: SiteLink;
}

export interface HeroSection {
  id: string;
  type: 'hero';
  badge: string;
  title: string;
  subtitle: string;
  primary: SiteLink;
  secondary: SiteLink;
  showSecondary: boolean;
  align: 'center' | 'left';
  imageUrl: string;
  // Show an email sign-up form instead of the primary button
  waitlist?: boolean;
}

export interface LogosSection {
  id: string;
  type: 'logos';
  title: string;
  logos: SiteLink[];
}

export interface BentoSection {
  id: string;
  type: 'bento';
  eyebrow: string;
  title: string;
  subtitle: string;
  tiles: BentoTile[];
}

export interface PricingSection {
  id: string;
  type: 'pricing';
  title: string;
  subtitle: string;
  plans: PricingPlan[];
}

export interface TestimonialsSection {
  id: string;
  type: 'testimonials';
  title: string;
  items: Testimonial[];
}

export interface FaqSection {
  id: string;
  type: 'faq';
  title: string;
  items: FaqItem[];
}

export interface CtaSection {
  id: string;
  type: 'cta';
  title: string;
  subtitle: string;
  button: SiteLink;
  waitlist?: boolean;
}

export interface FooterSection {
  id: string;
  type: 'footer';
  text: string;
  links: SiteLink[];
}

export type Section =
  | NavbarSection
  | HeroSection
  | LogosSection
  | BentoSection
  | PricingSection
  | TestimonialsSection
  | FaqSection
  | CtaSection
  | FooterSection;

export type SectionType = Section['type'];

export interface SiteData {
  version: 2;
  id?: string;
  slug?: string;
  projectName: string;
  template?: string;
  theme: SiteTheme;
  sections: Section[];
  // What visitors see. Edits autosave to the draft above and go live on Publish.
  // null = never published; undefined = page from before drafts existed (always live).
  publishedSite?: SiteData | null;
}

export function isSiteData(data: unknown): data is SiteData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { version?: unknown }).version === 2 &&
    Array.isArray((data as { sections?: unknown }).sections)
  );
}
