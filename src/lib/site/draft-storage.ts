import type { SiteData } from './types';

// A page built in the no-account playground, kept in this browser so it
// survives a refresh and carries over through sign-up.
const KEY = 'onepagelaunch:playground-draft';

export interface StoredDraft {
  site: SiteData;
  // The user clicked Publish: go live as soon as the account exists
  publish: boolean;
  // Template page the draft was started from (the style may have changed since)
  origin?: string;
  // Page address claimed on the homepage, used when publishing
  address?: string;
}

export function saveDraft(site: SiteData, options: { publish?: boolean; origin?: string; address?: string } = {}): void {
  try {
    const draft: StoredDraft = { site, publish: !!options.publish, origin: options.origin, address: options.address };
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked: the playground still works, it just won't persist
  }
}

export function loadDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    return parsed?.site?.version === 2 && Array.isArray(parsed.site.sections) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
