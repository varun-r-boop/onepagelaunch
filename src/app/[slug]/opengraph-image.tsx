import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { isSiteData } from '@/lib/site/types';
import { liveSiteOf } from '@/lib/site/publish';
import { themePalette } from '@/lib/site/themes';
import { PAGE_HOST } from '@/lib/slug';

// The card shown when a page's link is shared on X, LinkedIn, Slack, iMessage…
// Built from the live (published) page, so it follows its colors and words.

export const alt = 'Page preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Inter in the given weight, trimmed to just the characters used. Falls back to
// the default font if Google Fonts can't be reached.
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    // All columns, so this works before the custom_domain column is added
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const site = project && isSiteData(project.data) ? liveSiteOf(project.data) : null;
  const theme = site?.theme ?? { preset: 'light' as const, accent: '#4f46e5', background: '#ffffff', font: 'inter' as const, radius: 'rounded' as const };
  const colors = themePalette(theme);

  const nav = site?.sections.find(s => s.type === 'navbar');
  const hero = site?.sections.find(s => s.type === 'hero');
  const name = nav?.type === 'navbar' ? nav.logo : site?.projectName ?? 'OnePageLaunch';
  const headline = hero?.type === 'hero' ? hero.title : site ? `${name} is coming soon` : 'Launch your product page in minutes';
  const subtitle = hero?.type === 'hero' ? hero.subtitle : '';
  const button = hero?.type === 'hero' ? (hero.waitlist ? hero.primary.label || 'Join the waitlist' : hero.primary.label) : '';
  const address = project?.custom_domain || `${PAGE_HOST}/${slug}`;
  const radius = theme.radius === 'sharp' ? 6 : theme.radius === 'soft' ? 28 : 16;

  const text = [name, headline, subtitle, button, address].join(' ');
  const [regular, bold] = await Promise.all([loadFont(400, text), loadFont(800, text)]);
  const fonts = [
    ...(regular ? [{ name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
    ...(bold ? [{ name: 'Inter', data: bold, weight: 800 as const, style: 'normal' as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${colors.glow}, transparent 70%), ${colors.bg}`,
          color: colors.fg,
          fontFamily: fonts.length ? 'Inter' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: radius / 2 + 4, background: colors.accent }} />
          <div style={{ fontSize: 34, fontWeight: 800 }}>{clip(name, 30)}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: headline.length > 48 ? 64 : 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            {clip(headline, 90)}
          </div>
          {subtitle && <div style={{ fontSize: 30, color: colors.muted, lineHeight: 1.35 }}>{clip(subtitle, 130)}</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 26, color: colors.muted }}>{address}</div>
          {button && (
            <div style={{ display: 'flex', padding: '16px 30px', borderRadius: radius, background: colors.accent, color: colors.accentFg, fontSize: 28, fontWeight: 800 }}>
              {clip(button, 28)}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
