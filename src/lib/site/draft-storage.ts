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
}

export function saveDraft(site: SiteData, publish = false, origin?: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ site, publish, origin } satisfies StoredDraft));
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
