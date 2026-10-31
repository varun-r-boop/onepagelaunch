// Page addresses: onepagelaunch.vercel.app/<slug>

// Top-level paths the app itself uses (plus a few we may want later)
const RESERVED = new Set([
  'api', 'auth', 'create', 'dashboard', 'templates', 'login', 'signin', 'signup', 'logout',
  'settings', 'account', 'admin', 'about', 'pricing', 'blog', 'help', 'support', 'docs',
  'terms', 'privacy', 'www', 'app', 'static', 'public', 'favicon.ico', '_next',
]);

export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 40;

// Lowercase letters, numbers and single dashes, as the user types
export function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+/, '').slice(0, MAX_SLUG_LENGTH);
}

export type SlugProblem = 'short' | 'reserved' | 'invalid' | null;

export function slugProblem(slug: string): SlugProblem {
  if (slug.length < MIN_SLUG_LENGTH) return 'short';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return 'invalid';
  if (RESERVED.has(slug)) return 'reserved';
  return null;
}

export const PAGE_HOST = 'onepagelaunch.vercel.app';
