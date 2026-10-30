'use client';

import * as React from 'react';
import { Check, ChevronDown, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_SWATCHES, BACKGROUND_SWATCHES, THEME_FONTS, THEME_RADII, readableOn, themeBackground } from '@/lib/site/themes';
import { OPTIONAL_SECTIONS, setSectionEnabled } from '@/lib/site/quickstart';
import type { Section, SectionType, SiteData, ThemeFont, ThemeRadius } from '@/lib/site/types';

const heading = 'mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500';

function Swatch({ color, label, active, onPick }: { color: string; label: string; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onPick}
      className={cn('flex h-8 w-8 items-center justify-center rounded-full border border-black/15 cursor-pointer', active && 'ring-2 ring-gray-900 ring-offset-2')}
      style={{ background: color }}
    >
      {active && <Check className="h-4 w-4" style={{ color: readableOn(color) }} />}
    </button>
  );
}

function CustomColor({ value, label, onChange }: { value: string; label: string; onChange: (color: string) => void }) {
  return (
    <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-400 text-gray-500" title={label}>
      <Plus className="h-4 w-4" />
      <input type="color" aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
    </label>
  );
}

interface DesignPanelProps {
  site: SiteData;
  onChange: (fn: (prev: SiteData) => SiteData) => void;
  onStartOver: () => void;
  // Sections the user switched off, kept so switching back on restores their edits
  removed: React.MutableRefObject<Map<SectionType, Section>>;
}

// Everything about the page's look, applied live while the user edits
export default function DesignPanel({ site, onChange, onStartOver, removed }: DesignPanelProps) {
  const [fineTune, setFineTune] = React.useState(false);
  const theme = site.theme;
  const background = themeBackground(theme);
  const setTheme = (patch: Partial<SiteData['theme']>) => onChange(prev => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const toggleSection = (type: SectionType, on: boolean) => {
    onChange(prev => {
      if (!on) {
        const existing = prev.sections.find(s => s.type === type);
        if (existing) removed.current.set(type, existing);
      }
      return setSectionEnabled(prev, type, on, on ? removed.current.get(type) : undefined);
    });
  };

  return (
    <div className="p-5">
        <h3 className={heading}>Primary color</h3>
        <p className="-mt-1 mb-2 text-xs text-gray-500">Buttons, highlights and accents</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {ACCENT_SWATCHES.map(color => (
            <Swatch key={color} color={color} label={color} active={theme.accent === color} onPick={() => setTheme({ accent: color })} />
          ))}
          <CustomColor value={theme.accent} label="Custom primary color" onChange={accent => setTheme({ accent })} />
        </div>

        <h3 className={heading}>Secondary color</h3>
        <p className="-mt-1 mb-2 text-xs text-gray-500">Page background. Text and cards adjust to it.</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {BACKGROUND_SWATCHES.map(({ color, label }) => (
            <Swatch key={color} color={color} label={label} active={background === color} onPick={() => setTheme({ background: color })} />
          ))}
          <CustomColor value={background} label="Custom background color" onChange={color => setTheme({ background: color })} />
        </div>

        <h3 className={heading}>What’s on your page</h3>
        <div className="mb-6 space-y-0.5">
          {OPTIONAL_SECTIONS.map(s => {
            const on = site.sections.some(x => x.type === s.type);
            return (
              <button
                key={s.type}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggleSection(s.type, !on)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 cursor-pointer"
              >
                <span>
                  <span className="block text-sm font-medium text-gray-900">{s.label}</span>
                  <span className="block text-xs text-gray-500">{s.hint}</span>
                </span>
                <span className={cn('relative h-6 w-10 shrink-0 rounded-full transition', on ? 'bg-gray-900' : 'bg-gray-200')}>
                  <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setFineTune(o => !o)}
          className="mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-900 cursor-pointer"
          aria-expanded={fineTune}
        >
          Fine-tune <ChevronDown className={cn('h-4 w-4 transition-transform', fineTune && 'rotate-180')} />
        </button>
        {fineTune && (
          <>
            <h3 className={heading}>Font</h3>
            <div className="mb-6 grid grid-cols-2 gap-2">
              {(Object.keys(THEME_FONTS) as ThemeFont[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme({ font: key })}
                  className={cn('rounded-lg border-2 px-3 py-2 text-left cursor-pointer', theme.font === key ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
                >
                  <span className="block text-xl text-gray-900" style={{ fontFamily: THEME_FONTS[key].family }}>Aa</span>
                  <span className="text-xs text-gray-500">{THEME_FONTS[key].label}</span>
                </button>
              ))}
            </div>

            <h3 className={heading}>Corners</h3>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {(Object.keys(THEME_RADII) as ThemeRadius[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme({ radius: key })}
                  className={cn('flex flex-col items-center gap-2 rounded-lg border-2 py-3 cursor-pointer', theme.radius === key ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
                >
                  <span className="h-6 w-10 border-2 border-gray-700" style={{ borderRadius: key === 'soft' ? '12px' : key === 'rounded' ? '6px' : '1px' }} />
                  <span className="text-xs text-gray-600">{THEME_RADII[key].label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onStartOver}
          className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-red-600 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start over with new answers
        </button>
    </div>
  );
}
