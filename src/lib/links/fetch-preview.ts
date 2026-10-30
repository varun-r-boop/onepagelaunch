// Server-only: uses Node's dns and net modules.
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { detectLink, type LinkPreview } from './detect';

const TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'Mozilla/5.0 (compatible; OnePageLaunchBot/1.0; +https://onepagelaunch.vercel.app)';

// ---------- Safe fetching ----------
// Pasted URLs are untrusted. Only fetch public internet addresses so nobody can
// use this endpoint to reach internal services (SSRF).

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === '::' || l === '::1') return true;
    if (l.startsWith('::ffff:')) {
      const v4 = l.slice(7);
      return net.isIPv4(v4) ? isPrivateIp(v4) : true;
    }
    return /^f[cd]/.test(l) || /^fe[89ab]/.test(l) || l.startsWith('ff');
  }
  return true;
}

export async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Unsupported protocol');
  if (url.username || url.password) throw new Error('Credentials in URL');
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('Unsupported port');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) throw new Error('Private host');
  const addresses = net.isIP(host) ? [host] : (await lookup(host, { all: true })).map(a => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateIp)) throw new Error('Private address');
}

async function safeFetch(input: string, accept: string, extraHeaders: Record<string, string> = {}): Promise<Response> {
  let url = new URL(input);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, Accept: accept, 'Accept-Language': 'en', ...extraHeaders },
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }
  throw new Error('Too many redirects');
}

async function readLimited(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes));
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await safeFetch(url, 'application/json', headers);
  return JSON.parse(await readLimited(res, MAX_HTML_BYTES)) as T;
}

// ---------- HTML metadata ----------

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&');
}

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? '');
  }
  return out;
}

export interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
  siteName?: string;
}

// Reads Open Graph / Twitter card tags, <title> and the favicon from a page
export function parsePageMeta(html: string, baseUrl: string): PageMeta {
  const head = html.slice(0, html.search(/<\/head>/i) > 0 ? html.search(/<\/head>/i) : html.length);
  const meta: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const a = attributes(tag);
    const key = (a.property || a.name || '').toLowerCase();
    if (key && a.content && !meta[key]) meta[key] = a.content.trim();
  }
  let icon: string | undefined;
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const a = attributes(tag);
    const rel = (a.rel || '').toLowerCase();
    if (a.href && (rel.includes('apple-touch-icon') || (!icon && rel.split(/\s+/).includes('icon')))) icon = a.href;
  }
  const absolute = (value?: string) => {
    if (!value) return undefined;
    try {
      const u = new URL(value, baseUrl);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : undefined;
    } catch {
      return undefined;
    }
  };
  const title = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  return {
    title: meta['og:title'] || meta['twitter:title'] || (title ? decodeEntities(title).trim() : undefined),
    description: meta['og:description'] || meta['twitter:description'] || meta.description,
    image: absolute(meta['og:image'] || meta['og:image:url'] || meta['twitter:image'] || meta['twitter:image:src']),
    icon: absolute(icon),
    siteName: meta['og:site_name'],
  };
}

// ---------- Providers ----------

const short = (text: string | undefined, max = 160) => {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(n);
}

const favicon = (url: string) => `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;

async function enrichPage(p: LinkPreview): Promise<LinkPreview> {
  const res = await safeFetch(p.url, 'text/html,application/xhtml+xml');
  if (!(res.headers.get('content-type') ?? '').includes('html')) return p;
  const meta = parsePageMeta(await readLimited(res, MAX_HTML_BYTES), res.url || p.url);
  return {
    ...p,
    title: short(meta.title, 80) || p.title,
    description: short(meta.description) || p.description,
    imageUrl: meta.image ?? p.imageUrl,
    iconUrl: p.kind === 'page' ? meta.icon ?? favicon(p.url) : p.iconUrl,
  };
}

interface GithubRepo { full_name: string; description: string | null; stargazers_count: number; language: string | null; owner: { avatar_url: string } }

async function enrichRepo(p: LinkPreview): Promise<LinkPreview> {
  const [, owner, repo] = new URL(p.url).pathname.split('/');
  // Unauthenticated GitHub calls are limited to 60/hour per server IP; a token raises that
  const token = process.env.GITHUB_TOKEN;
  const data = await fetchJson<GithubRepo>(
    `https://api.github.com/repos/${owner}/${repo}`,
    token ? { Authorization: `Bearer ${token}` } : {},
  );
  return {
    ...p,
    title: data.full_name,
    description: short(data.description ?? '') || p.description,
    iconUrl: data.owner.avatar_url,
    meta: [`★ ${compactNumber(data.stargazers_count)}`, data.language].filter(Boolean).join(' · '),
  };
}

interface OEmbed { title?: string; author_name?: string; thumbnail_url?: string; html?: string }

async function enrichVideo(p: LinkPreview): Promise<LinkPreview> {
  const host = new URL(p.url).hostname;
  const endpoint = host.includes('youtube')
    ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(p.url)}`
    : host.includes('loom')
      ? `https://www.loom.com/v1/oembed?url=${encodeURIComponent(p.url)}`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(p.url)}`;
  const data = await fetchJson<OEmbed>(endpoint);
  return { ...p, title: short(data.title, 80) || p.title, imageUrl: p.imageUrl ?? data.thumbnail_url };
}

// Tweet text comes from X's public oEmbed endpoint
export function parseTweetHtml(html: string): string {
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '';
  return decodeEntities(paragraph.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
}

async function enrichPost(p: LinkPreview): Promise<LinkPreview> {
  const data = await fetchJson<OEmbed>(`https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=${encodeURIComponent(p.url)}`);
  const text = parseTweetHtml(data.html ?? '');
  return {
    ...p,
    description: text ? `“${short(text, 280)}”` : p.description,
    author: data.author_name ? `${data.author_name} (${p.author})` : p.author,
  };
}

interface ItunesLookup { results: { trackName: string; artworkUrl512?: string; artworkUrl100?: string; averageUserRating?: number; userRatingCount?: number }[] }

async function enrichApp(p: LinkPreview): Promise<LinkPreview> {
  const id = p.url.match(/\/id(\d+)/)?.[1];
  if (!id) return enrichPage(p);
  const data = await fetchJson<ItunesLookup>(`https://itunes.apple.com/lookup?id=${id}`);
  const app = data.results[0];
  if (!app) return p;
  const rating = app.averageUserRating ? `★ ${app.averageUserRating.toFixed(1)}` : '';
  const count = app.userRatingCount ? `${compactNumber(app.userRatingCount)} ratings` : '';
  return {
    ...p,
    title: app.trackName,
    iconUrl: app.artworkUrl512 ?? app.artworkUrl100,
    meta: [rating, count].filter(Boolean).join(' · ') || p.meta,
  };
}

interface DiscordInvite { guild?: { id: string; name: string; icon?: string | null }; approximate_member_count?: number }

async function enrichCommunity(p: LinkPreview): Promise<LinkPreview> {
  const code = new URL(p.url).pathname.split('/').filter(Boolean).pop();
  if (!p.url.includes('discord') || !code) return p;
  const data = await fetchJson<DiscordInvite>(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`);
  if (!data.guild) return p;
  return {
    ...p,
    title: `Join ${data.guild.name}`,
    iconUrl: data.guild.icon ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png` : undefined,
    meta: data.approximate_member_count ? `${compactNumber(data.approximate_member_count)} members` : undefined,
  };
}

// ---------- Entry point with a small in-memory cache ----------

const cache = new Map<string, { preview: LinkPreview; expires: number }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

export async function getLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const base = detectLink(rawUrl);
  const hit = cache.get(base.url);
  if (hit && hit.expires > Date.now()) return hit.preview;

  let preview = base;
  try {
    switch (base.kind) {
      case 'repo': preview = await enrichRepo(base); break;
      case 'video': preview = await enrichVideo(base); break;
      case 'post': preview = await enrichPost(base); break;
      case 'app': preview = await enrichApp(base); break;
      case 'community': preview = await enrichCommunity(base); break;
      case 'page':
      case 'launch': preview = await enrichPage(base); break;
      // Profiles, emails and booking links need nothing from the network
      default: break;
    }
  } catch {
    // Blocked, offline or unreachable: the URL-only preview is still useful
    return base;
  }

  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  cache.set(base.url, { preview, expires: Date.now() + CACHE_MS });
  return preview;
}
