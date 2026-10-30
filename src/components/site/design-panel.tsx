'use client';

import * as React from 'react';
import { Check, ChevronDown, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_SWATCHES, THEME_FONTS, THEME_PRESETS, THEME_RADII, readableOn } from '@/lib/site/themes';
import { SITE_TEMPLATES } from '@/lib/site/templates';
import { OPTIONAL_SECTIONS, applyStyle, setSectionEnabled } from '@/lib/site/quickstart';
import type { Section, SectionType, SiteData, ThemeFont, ThemePreset, ThemeRadius } from '@/lib/site/types';

const heading = 'mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500';

interface DesignPanelProps {
  site: SiteData;
  onChange: (fn: (prev: SiteData) => SiteData) => void;
  onClose: () => void;
  onStartOver: () => void;
  // Sections the user switched off, kept so switching back on restores their edits
  removed: React.MutableRefObject<Map<SectionType, Section>>;
}

// Everything about the page's look, applied live while the user edits
export default function DesignPanel({ site, onChange, onClose, onStartOver, removed }: DesignPanelProps) {
  const [fineTune, setFineTune] = React.useState(false);
  const theme = site.theme;
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
    <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-full flex-col border-l border-gray-200 bg-white shadow-xl sm:w-80">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">Design</h2>
          <p className="text-xs text-gray-500">Changes apply instantly. Your text is kept.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close design panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <h3 className={heading}>Style</h3>
        <div className="mb-6 space-y-2">
          {SITE_TEMPLATES.map(t => {
            const p = THEME_PRESETS[t.theme.preset];
            const active = site.template === t.id && theme.preset === t.theme.preset && theme.font === t.theme.font;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(prev => applyStyle(prev, t.id))}
                className={cn('flex w-full items-center gap-3 rounded-xl border-2 p-2.5 text-left transition cursor-pointer', active ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
              >
                <span className="flex h-10 w-14 shrink-0 items-end gap-1 rounded-lg p-1.5" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                  <span className="h-2 w-5 rounded-sm" style={{ background: p.fg }} />
                  <span className="h-2 w-2 rounded-full" style={{ background: t.theme.accent }} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900" style={{ fontFamily: THEME_FONTS[t.theme.font].family }}>{t.name}</span>
                  <span className="block truncate text-xs text-gray-500">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <h3 className={heading}>Brand color</h3>
        <div className="mb-6 flex flex-wrap gap-2">
          {ACCENT_SWATCHES.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => setTheme({ accent: color })}
              className={cn('flex h-8 w-8 items-center justify-center rounded-full border border-black/10 cursor-pointer', theme.accent === color && 'ring-2 ring-gray-900 ring-offset-2')}
              style={{ background: color }}
            >
              {theme.accent === color && <Check className="h-4 w-4" style={{ color: readableOn(color) }} />}
            </button>
          ))}
          <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-400 text-gray-500" title="Custom color">
            <Plus className="h-4 w-4" />
            <input type="color" value={theme.accent} onChange={e => setTheme({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
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
            <h3 className={heading}>Theme</h3>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {(Object.keys(THEME_PRESETS) as ThemePreset[]).map(key => {
                const p = THEME_PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme({ preset: key, accent: p.defaultAccent })}
                    className={cn('overflow-hidden rounded-lg border-2 text-left cursor-pointer', theme.preset === key ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
                  >
                    <div className="flex h-10 items-end gap-1 p-2" style={{ background: p.bg }}>
                      <span className="h-4 w-3 rounded-sm" style={{ background: p.card, border: `1px solid ${p.border}` }} />
                      <span className="h-2.5 w-5 rounded-sm" style={{ background: p.fg }} />
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.defaultAccent }} />
                    </div>
                    <p className="px-2 py-1 text-xs font-medium text-gray-700">{p.label}</p>
                  </button>
                );
              })}
            </div>

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
    </aside>
  );
}
