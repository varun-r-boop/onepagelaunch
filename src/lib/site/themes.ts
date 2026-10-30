import type { CSSProperties } from 'react';
import type { SiteTheme, ThemeFont, ThemePreset, ThemeRadius } from './types';

interface PresetColors {
  label: string;
  bg: string;
  fg: string;
  muted: string;
  card: string;
  border: string;
  // Soft glow drawn behind the hero
  glow: string;
  defaultAccent: string;
}

export const THEME_PRESETS: Record<ThemePreset, PresetColors> = {
  light: {
    label: 'Light',
    bg: '#ffffff',
    fg: '#0a0a0a',
    muted: '#6b7280',
    card: '#f6f6f7',
    border: '#e8e8eb',
    glow: 'rgba(99, 102, 241, 0.12)',
    defaultAccent: '#4f46e5',
  },
  dark: {
    label: 'Dark',
    bg: '#09090b',
    fg: '#fafafa',
    muted: '#a1a1aa',
    card: '#131316',
    border: '#26262b',
    glow: 'rgba(255, 255, 255, 0.06)',
    defaultAccent: '#fafafa',
  },
  midnight: {
    label: 'Midnight',
    bg: '#070b1a',
    fg: '#eef2ff',
    muted: '#94a3c4',
    card: '#0e1530',
    border: '#1d2850',
    glow: 'rgba(99, 102, 241, 0.28)',
    defaultAccent: '#818cf8',
  },
  cream: {
    label: 'Cream',
    bg: '#faf7f2',
    fg: '#1c1917',
    muted: '#78716c',
    card: '#f1ece3',
    border: '#e4ddd0',
    glow: 'rgba(234, 88, 12, 0.10)',
    defaultAccent: '#ea580c',
  },
  forest: {
    label: 'Forest',
    bg: '#0b1410',
    fg: '#ecfdf5',
    muted: '#9bb8aa',
    card: '#111f19',
    border: '#1f3329',
    glow: 'rgba(52, 211, 153, 0.18)',
    defaultAccent: '#34d399',
  },
  mono: {
    label: 'Mono',
    bg: '#f4f4f0',
    fg: '#111111',
    muted: '#666660',
    card: '#ffffff',
    border: '#111111',
    glow: 'rgba(0, 0, 0, 0)',
    defaultAccent: '#111111',
  },
};

export const THEME_FONTS: Record<ThemeFont, { label: string; family: string; googleFamily: string }> = {
  inter: { label: 'Inter', family: '"Inter", ui-sans-serif, system-ui, sans-serif', googleFamily: 'Inter:wght@400;500;600;700;800' },
  grotesk: { label: 'Grotesk', family: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', googleFamily: 'Space+Grotesk:wght@400;500;600;700' },
  serif: { label: 'Serif', family: '"Instrument Serif", ui-serif, Georgia, serif', googleFamily: 'Instrument+Serif:ital@0;1' },
  mono: { label: 'Mono', family: '"JetBrains Mono", ui-monospace, monospace', googleFamily: 'JetBrains+Mono:wght@400;500;700' },
};

export const THEME_RADII: Record<ThemeRadius, { label: string; value: string }> = {
  sharp: { label: 'Sharp', value: '4px' },
  rounded: { label: 'Rounded', value: '14px' },
  soft: { label: 'Soft', value: '28px' },
};

export const ACCENT_SWATCHES = [
  '#4f46e5', '#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16',
  '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#111111',
];

// Picks black or white text for a given background color
export function readableOn(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0a0a0a' : '#ffffff';
}

export function themeToCssVars(theme: SiteTheme): CSSProperties {
  const preset = THEME_PRESETS[theme.preset] ?? THEME_PRESETS.light;
  const font = THEME_FONTS[theme.font] ?? THEME_FONTS.inter;
  const radius = THEME_RADII[theme.radius] ?? THEME_RADII.rounded;
  return {
    '--site-bg': preset.bg,
    '--site-fg': preset.fg,
    '--site-muted': preset.muted,
    '--site-card': preset.card,
    '--site-border': preset.border,
    '--site-glow': preset.glow,
    '--site-accent': theme.accent,
    '--site-accent-fg': readableOn(theme.accent),
    '--site-radius': radius.value,
    '--site-font': font.family,
    backgroundColor: preset.bg,
    color: preset.fg,
    fontFamily: font.family,
  } as CSSProperties;
}

export function googleFontsHref(): string {
  const families = Object.values(THEME_FONTS).map(f => `family=${f.googleFamily}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
