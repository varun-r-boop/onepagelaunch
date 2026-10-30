import { detectLink, extractUrls, type LinkPreview } from './detect';

// Turns pasted text into link previews. Falls back to what we can tell from the
// URLs alone if the preview service is unreachable, so pasting always works.
export async function resolveLinks(text: string): Promise<LinkPreview[]> {
  const urls = extractUrls(text);
  if (urls.length === 0) return [];
  try {
    const res = await fetch('/api/link-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { previews } = (await res.json()) as { previews: LinkPreview[] };
    return previews;
  } catch {
    return urls.map(detectLink);
  }
}
