'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_SWATCHES, THEME_PRESETS, readableOn } from '@/lib/site/themes';
import { SITE_TEMPLATES, getTemplate } from '@/lib/site/templates';
import {
  OPTIONAL_SECTIONS, buildQuickStartSite, type QuickStartChoices, type QuickStartInfo,
} from '@/lib/site/quickstart';
import type { SectionType, SiteData } from '@/lib/site/types';
import { resolveLinks } from '@/lib/links/client';
import { detectLink, extractUrls, type LinkPreview } from '@/lib/links/detect';
import { applyLinksToSite, carryOverLinks } from '@/lib/links/apply';
import SiteRenderer from './SiteRenderer';

interface QuickStartWizardProps {
  initialInfo: QuickStartInfo;
  initialChoices: QuickStartChoices;
  base: Pick<SiteData, 'projectName' | 'slug'>;
  // Restyling an existing page skips straight to the look, with the user's text kept
  startAtStyle?: boolean;
  // When restyling, links already on this page are kept
  carryFrom?: SiteData;
  onFinish: (site: SiteData) => void;
  onClose?: () => void;
}

// Renders the site at desktop width, scaled to fit the available column
function FitPreview({ site }: { site: SiteData }) {
  const outer = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    if (!outer.current || !inner.current) return;
    const observer = new ResizeObserver(() => {
      setScale(outer.current!.clientWidth / 1280);
      setHeight(inner.current!.offsetHeight);
    });
    observer.observe(outer.current);
    observer.observe(inner.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden rounded-xl shadow-lg ring-1 ring-black/10" style={{ background: THEME_PRESETS[site.theme.preset].bg }}>
      <div ref={outer} className="relative w-full overflow-hidden" style={{ height: height * scale }}>
        <div ref={inner} className="pointer-events-none absolute left-0 top-0" style={{ width: 1280, transform: `scale(${scale})`, transformOrigin: 'top left' }} aria-hidden>
          <SiteRenderer site={site} thumbnail />
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-900">{label}</span>
      {hint && <span className="mb-2 block text-sm text-gray-500">{hint}</span>}
      {children}
    </label>
  );
}

const inputClass = 'mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5';

export default function QuickStartWizard({ initialInfo, initialChoices, base, startAtStyle, carryFrom, onFinish, onClose }: QuickStartWizardProps) {
  const [step, setStep] = React.useState<1 | 2>(startAtStyle ? 2 : 1);
  const [info, setInfo] = React.useState(initialInfo);
  const [choices, setChoices] = React.useState(initialChoices);

  const [linksText, setLinksText] = React.useState('');
  const [previews, setPreviews] = React.useState<LinkPreview[]>([]);
  const [resolvedFor, setResolvedFor] = React.useState('');
  const [resolving, setResolving] = React.useState(false);

  const { projectName, slug } = base;
  const preview = React.useMemo(() => {
    // No description typed? Borrow one from their repo, app or website
    // (only real fetched text, not the generic fallback like "View the source on GitHub")
    const borrowed = previews.find(p => ['repo', 'app', 'page'].includes(p.kind) && p.description && p.description !== detectLink(p.url).description)?.description ?? '';
    const filled = { ...info, description: info.description.trim() || borrowed };
    const built = applyLinksToSite(buildQuickStartSite(filled, choices, { projectName, slug }), previews).site;
    return carryFrom ? carryOverLinks(carryFrom, built) : built;
  }, [info, choices, projectName, slug, previews, carryFrom]);
  const canContinue = info.name.trim().length > 0 && !resolving;
  const linkCount = extractUrls(linksText).length;

  const next = async () => {
    if (!canContinue) return;
    if (linksText !== resolvedFor) {
      setResolving(true);
      try {
        setPreviews(await resolveLinks(linksText));
        setResolvedFor(linksText);
      } finally {
        setResolving(false);
      }
    }
    setStep(2);
  };

  const toggle = (type: SectionType) =>
    setChoices(c => ({ ...c, include: c.include.includes(type) ? c.include.filter(t => t !== type) : [...c.include, type] }));

  const setInfoField = (key: keyof QuickStartInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInfo(i => ({ ...i, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="text-lg">🧱</span> Set up your page
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className={cn('rounded-full px-2.5 py-1', step === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100')}>1 · About</span>
          <span className={cn('rounded-full px-2.5 py-1', step === 2 ? 'bg-gray-900 text-white' : 'bg-gray-100')}>2 · Look</span>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        ) : <span className="w-8" />}
      </div>

      {step === 1 ? (
        <form
          className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-10 sm:items-center"
          onSubmit={e => { e.preventDefault(); void next(); }}
        >
          <div className="w-full max-w-lg">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tell us about your product</h1>
            <p className="mt-2 text-gray-500">We’ll write your page from this. You can change any of it later.</p>

            <div className="mt-8 space-y-6">
              <Field label="Product name">
                <input autoFocus required value={info.name} onChange={setInfoField('name')} placeholder="Acme" className={inputClass} />
              </Field>
              <Field label="What does it do?" hint="One line. This becomes your big headline.">
                <input value={info.headline} onChange={setInfoField('headline')} placeholder="Invoicing for freelancers that takes 10 seconds" className={inputClass} />
              </Field>
              <Field label="Tell people a bit more" hint="Optional. Who is it for and why will they love it?">
                <textarea
                  rows={3}
                  value={info.description}
                  onChange={setInfoField('description')}
                  placeholder="Send beautiful invoices, get paid faster, and never chase a client again."
                  className={cn(inputClass, 'resize-none')}
                />
              </Field>
              <Field label="Where should your main button go?" hint="Optional. Your sign-up page, app, waitlist or email.">
                <input value={info.link} onChange={setInfoField('link')} placeholder="app.acme.com/signup" className={inputClass} />
              </Field>
              <Field label="Your links" hint="Optional. Paste any links, one per line: GitHub, a demo video, App Store, X, LinkedIn, Discord… Each becomes a tile.">
                <textarea
                  rows={3}
                  value={linksText}
                  onChange={e => setLinksText(e.target.value)}
                  placeholder={'github.com/acme/acme\nyoutube.com/watch?v=…\nx.com/acme'}
                  className={cn(inputClass, 'resize-none font-mono text-sm')}
                />
                {linkCount > 0 && <span className="mt-1 block text-xs text-gray-500">{linkCount} {linkCount === 1 ? 'link' : 'links'} found</span>}
              </Field>
            </div>

            <button
              type="submit"
              disabled={!canContinue}
              className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-gray-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {resolving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Reading your links…</>
              ) : (
                <>Next: pick a look <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Choices */}
          <div className="w-full shrink-0 overflow-y-auto border-gray-200 bg-white p-6 lg:w-[380px] lg:border-r">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pick a look</h2>
            <p className="mt-1 text-sm text-gray-500">
              {startAtStyle
                ? 'Your name, headline and link are kept. Other sections start fresh (you can undo).'
                : 'The preview updates as you choose.'}
            </p>

            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">Style</h3>
            <div className="space-y-2">
              {SITE_TEMPLATES.map(t => {
                const p = THEME_PRESETS[t.theme.preset];
                const active = choices.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setChoices(c => ({ ...c, templateId: t.id, accent: t.theme.accent }))}
                    className={cn('flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition cursor-pointer', active ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
                  >
                    <span className="flex h-10 w-14 shrink-0 items-end gap-1 rounded-lg p-1.5" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                      <span className="h-2 w-5 rounded-sm" style={{ background: p.fg }} />
                      <span className="h-2 w-2 rounded-full" style={{ background: t.theme.accent }} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900">{t.name}</span>
                      <span className="block text-xs text-gray-500">{t.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">Brand color</h3>
            <div className="flex flex-wrap gap-2">
              {[getTemplate(choices.templateId).theme.accent, ...ACCENT_SWATCHES.filter(c => c !== getTemplate(choices.templateId).theme.accent)].map(color => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => setChoices(c => ({ ...c, accent: color }))}
                  className={cn('flex h-8 w-8 items-center justify-center rounded-full border border-black/10 cursor-pointer', choices.accent === color && 'ring-2 ring-gray-900 ring-offset-2')}
                  style={{ background: color }}
                >
                  {choices.accent === color && <Check className="h-4 w-4" style={{ color: readableOn(color) }} />}
                </button>
              ))}
            </div>

            <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500">What’s on your page</h3>
            <div className="space-y-1.5">
              {OPTIONAL_SECTIONS.map(s => {
                const on = choices.include.includes(s.type);
                return (
                  <button
                    key={s.type}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggle(s.type)}
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

            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => onFinish(preview)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> {startAtStyle ? 'Apply' : 'Create my page'}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="h-[60vh] min-w-0 flex-1 p-4 lg:h-auto lg:p-8">
            <FitPreview site={preview} />
          </div>
        </div>
      )}
    </div>
  );
}
