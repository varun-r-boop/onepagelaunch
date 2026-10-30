import { uid } from '@/lib/site/sections';
import type { BentoTile, SiteLink, TileSize } from '@/lib/site/types';

// What we know about a pasted link. Built offline from the URL alone, then
// enriched on the server with titles, images and counts when available.
export type LinkKind =
  | 'repo'        // GitHub repository
  | 'video'       // YouTube, Loom, Vimeo
  | 'post'        // A single tweet / X post
  | 'app'         // App Store or Google Play listing
  | 'launch'      // Product Hunt
  | 'calendar'    // Calendly, Cal.com, ...
  | 'community'   // Discord, Slack invites
  | 'social'      // A profile on a social network, or an email address
  | 'page';       // Anything else

export interface LinkPreview {
  url: string;
  kind: LinkKind;
  // Icon key from SITE_ICONS
  icon: string;
  // Network name for social profiles, e.g. "GitHub"
  platform?: string;
  title: string;
  description: string;
  imageUrl?: string;
  iconUrl?: string;
  meta?: string;
  embedUrl?: string;
  author?: string;
}

// Only these hosts may be framed on published pages
const EMBED_HOSTS = ['www.youtube-nocookie.com', 'www.loom.com', 'player.vimeo.com'];

export function isAllowedEmbed(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && EMBED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// Pulls every link out of pasted text: one per line, comma or space separated
export function extractUrls(text: string): string[] {
  const found = new Set<string>();
  for (const raw of text.split(/[\s,]+/)) {
    const token = raw.trim().replace(/[)>.,;]+$/, '');
    if (!token) continue;
    // Check mailto: first so already-converted emails aren't wrapped twice
    if (/^mailto:/i.test(token)) {
      found.add(token);
      continue;
    }
    if (/^[^@\s/:]+@[^@\s/]+\.[a-z]{2,}$/i.test(token)) {
      found.add(`mailto:${token}`);
      continue;
    }
    const candidate = /^https?:\/\//i.test(token) ? token : /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(token) ? `https://${token}` : null;
    if (!candidate) continue;
    try {
      const u = new URL(candidate);
      if (u.hostname.includes('.')) found.add(u.toString());
    } catch {
      // not a URL
    }
  }
  return [...found];
}

const cleanHost = (host: string) => host.toLowerCase().replace(/^(www|m|mobile)\./, '');

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

const SOCIALS: { hosts: string[]; platform: string; icon: string; handle: (parts: string[]) => string | null }[] = [
  { hosts: ['x.com', 'twitter.com'], platform: 'X', icon: 'twitter', handle: p => (p[0] && !['home', 'i', 'search', 'explore'].includes(p[0]) ? `@${p[0]}` : null) },
  { hosts: ['github.com'], platform: 'GitHub', icon: 'github', handle: p => (p.length === 1 ? p[0] : null) },
  { hosts: ['gitlab.com'], platform: 'GitLab', icon: 'gitlab', handle: p => (p.length === 1 ? p[0] : null) },
  { hosts: ['linkedin.com'], platform: 'LinkedIn', icon: 'linkedin', handle: p => (['in', 'company'].includes(p[0]) && p[1] ? p[1] : null) },
  { hosts: ['instagram.com'], platform: 'Instagram', icon: 'instagram', handle: p => (p[0] ? `@${p[0]}` : null) },
  { hosts: ['facebook.com'], platform: 'Facebook', icon: 'facebook', handle: p => p[0] ?? null },
  { hosts: ['tiktok.com'], platform: 'TikTok', icon: 'tiktok', handle: p => (p[0]?.startsWith('@') ? p[0] : null) },
  { hosts: ['threads.net', 'threads.com'], platform: 'Threads', icon: 'at', handle: p => (p[0]?.startsWith('@') ? p[0] : null) },
  { hosts: ['bsky.app'], platform: 'Bluesky', icon: 'at', handle: p => (p[0] === 'profile' && p[1] ? `@${p[1]}` : null) },
  { hosts: ['youtube.com'], platform: 'YouTube', icon: 'youtube', handle: p => (p[0]?.startsWith('@') ? p[0] : ['c', 'channel', 'user'].includes(p[0]) && p[1] ? p[1] : null) },
  { hosts: ['twitch.tv'], platform: 'Twitch', icon: 'twitch', handle: p => (p.length === 1 ? p[0] : null) },
  { hosts: ['dribbble.com'], platform: 'Dribbble', icon: 'dribbble', handle: p => (p.length === 1 ? p[0] : null) },
  { hosts: ['medium.com'], platform: 'Medium', icon: 'newspaper', handle: p => (p[0]?.startsWith('@') ? p[0] : null) },
];

const CALENDAR_HOSTS = ['calendly.com', 'cal.com', 'savvycal.com', 'zcal.co', 'tidycal.com'];

// Builds a preview from the URL alone. Always succeeds.
export function detectLink(input: string): LinkPreview {
  if (/^mailto:/i.test(input)) {
    const email = input.replace(/^mailto:/i, '').split('?')[0];
    return { url: `mailto:${email}`, kind: 'social', icon: 'mail', platform: 'Email', title: 'Email', description: email };
  }

  const url = new URL(input);
  const host = cleanHost(url.hostname);
  const parts = url.pathname.split('/').filter(Boolean);
  const href = url.toString();

  // YouTube video
  const ytId =
    host === 'youtu.be' ? parts[0]
      : host === 'youtube.com' && parts[0] === 'watch' ? url.searchParams.get('v')
        : host === 'youtube.com' && ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1]
          : null;
  if (ytId && /^[\w-]{6,20}$/.test(ytId)) {
    return {
      url: `https://www.youtube.com/watch?v=${ytId}`,
      kind: 'video',
      icon: 'youtube',
      title: 'Watch the demo',
      description: '',
      imageUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
    };
  }

  // Loom
  if (host === 'loom.com' && ['share', 'embed'].includes(parts[0]) && parts[1]) {
    return { url: href, kind: 'video', icon: 'video', title: 'Watch the walkthrough', description: '', embedUrl: `https://www.loom.com/embed/${parts[1]}` };
  }

  // Vimeo
  if (host === 'vimeo.com' && /^\d+$/.test(parts[0] ?? '')) {
    return { url: href, kind: 'video', icon: 'video', title: 'Watch the video', description: '', embedUrl: `https://player.vimeo.com/video/${parts[0]}` };
  }

  // A single X/Twitter post
  if ((host === 'x.com' || host === 'twitter.com') && parts[1] === 'status' && parts[2]) {
    return { url: href, kind: 'post', icon: 'twitter', title: `@${parts[0]}`, description: '', author: `@${parts[0]}` };
  }

  // GitHub repository (owner/repo), skipping GitHub's own pages
  const reserved = ['orgs', 'settings', 'features', 'marketplace', 'topics', 'sponsors', 'about', 'pricing', 'login', 'explore', 'collections'];
  if (host === 'github.com' && parts.length >= 2 && !reserved.includes(parts[0])) {
    return { url: `https://github.com/${parts[0]}/${parts[1]}`, kind: 'repo', icon: 'github', title: `${parts[0]}/${parts[1]}`, description: 'View the source on GitHub', meta: 'GitHub' };
  }

  // App stores
  if (host === 'apps.apple.com') {
    const name = parts.find((p, i) => parts[i - 1] === 'app' && !p.startsWith('id'));
    return { url: href, kind: 'app', icon: 'apple', title: name ? titleCase(name) : 'Our iPhone app', description: 'Download on the App Store', meta: 'App Store' };
  }
  if (host === 'play.google.com' && url.searchParams.get('id')) {
    const pkg = url.searchParams.get('id')!;
    return { url: href, kind: 'app', icon: 'play', title: titleCase(pkg.split('.').pop() ?? pkg), description: 'Get it on Google Play', meta: 'Google Play' };
  }

  // Product Hunt
  if (host === 'producthunt.com') {
    const slug = parts[parts.length - 1];
    return { url: href, kind: 'launch', icon: 'award', title: slug ? titleCase(slug) : 'Product Hunt', description: 'Support us on Product Hunt', meta: 'Featured on Product Hunt' };
  }

  // Booking links
  if (CALENDAR_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) {
    return { url: href, kind: 'calendar', icon: 'calendar', title: 'Book a demo', description: 'Pick a time that works for you' };
  }

  // Community invites
  if ((host === 'discord.gg' && parts[0]) || (host === 'discord.com' && parts[0] === 'invite' && parts[1])) {
    return { url: href, kind: 'community', icon: 'discord', title: 'Join our Discord', description: 'Chat with the team and community' };
  }
  if (host.endsWith('slack.com') && parts[0] === 'join') {
    return { url: href, kind: 'community', icon: 'slack', title: 'Join our Slack', description: 'Chat with the team and community' };
  }

  // Social profiles
  for (const social of SOCIALS) {
    if (!social.hosts.includes(host)) continue;
    const handle = social.handle(parts);
    if (handle) {
      return { url: href, kind: 'social', icon: social.icon, platform: social.platform, title: social.platform, description: handle };
    }
  }
  if (host.endsWith('.substack.com')) {
    return { url: href, kind: 'social', icon: 'newspaper', platform: 'Newsletter', title: 'Newsletter', description: host.split('.')[0] };
  }

  // Anything else: a website preview card
  return { url: href, kind: 'page', icon: 'globe', title: host, description: '', meta: host };
}

// Video and rich previews get a wide tile; profiles and buttons stay small
function tileSize(preview: LinkPreview): TileSize {
  if (preview.kind === 'video' || preview.kind === 'post' || preview.kind === 'repo') return 'wide';
  if (preview.kind === 'page' && preview.imageUrl) return 'wide';
  return 'sm';
}

export function tileFromPreview(preview: LinkPreview, size?: TileSize): BentoTile {
  const base = { id: uid('tile'), size: size ?? tileSize(preview), url: preview.url, icon: preview.icon };
  if (preview.kind === 'video') {
    return { ...base, kind: 'video', title: preview.title, body: preview.description, imageUrl: preview.imageUrl, embedUrl: preview.embedUrl };
  }
  if (preview.kind === 'post') {
    return { ...base, kind: 'quote', title: preview.author ?? preview.title, body: preview.description || '“Paste the post’s text here”' };
  }
  return {
    ...base,
    kind: 'link',
    title: preview.title,
    body: preview.description,
    imageUrl: preview.imageUrl,
    iconUrl: preview.iconUrl,
    meta: preview.meta,
  };
}

export function socialLinkFromPreview(preview: LinkPreview): SiteLink {
  return { id: uid('link'), label: preview.platform ?? preview.title, url: preview.url };
}
