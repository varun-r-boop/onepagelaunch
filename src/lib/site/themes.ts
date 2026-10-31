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

// Page background choices for the secondary color
export const BACKGROUND_SWATCHES: { color: string; label: string }[] = [
  { color: '#ffffff', label: 'White' },
  { color: '#f6f7f9', label: 'Mist' },
  { color: '#faf7f2', label: 'Cream' },
  { color: '#09090b', label: 'Black' },
  { color: '#070b1a', label: 'Midnight' },
  { color: '#0b1410', label: 'Forest' },
  { color: '#1c1917', label: 'Espresso' },
];

// ---------- Color math ----------

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (rgb: number[]) => `#${rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

// Blends `b` into `a`; amount 0 = a, 1 = b
function mix(a: string, b: string, amount: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  return toHex(ra.map((v, i) => v + (rb[i] - v) * amount));
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
}

// WCAG relative luminance, 0 (black) to 1 (white)
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const isDark = (hex: string) => luminance(hex) < 0.18;

// Full palette from the two colors the user picks
export function paletteFromColors(background: string, accent: string): Omit<PresetColors, 'label' | 'defaultAccent'> {
  const dark = isDark(background);
  const fg = dark ? mix(background, '#ffffff', 0.94) : mix(background, '#000000', 0.92);
  return {
    bg: background,
    fg,
    muted: mix(fg, background, 0.4),
    card: mix(background, fg, dark ? 0.06 : 0.035),
    border: mix(background, fg, dark ? 0.14 : 0.1),
    glow: withAlpha(accent, dark ? 0.28 : 0.12),
  };
}

// Background color of a theme, whichever system it uses
export function themeBackground(theme: SiteTheme): string {
  return theme.background ?? (THEME_PRESETS[theme.preset] ?? THEME_PRESETS.light).bg;
}

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
  const preset = theme.background
    ? paletteFromColors(theme.background, theme.accent)
    : THEME_PRESETS[theme.preset] ?? THEME_PRESETS.light;
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
