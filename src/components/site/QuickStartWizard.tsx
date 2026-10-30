'use client';

import * as React from 'react';
import { ArrowRight, Link2, Loader2, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_INCLUDE, buildQuickStartSite, type QuickStartInfo } from '@/lib/site/quickstart';
import { getTemplate } from '@/lib/site/templates';
import type { SiteData } from '@/lib/site/types';
import { resolveLinks } from '@/lib/links/client';
import { detectLink, extractUrls } from '@/lib/links/detect';
import { applyLinksToSite } from '@/lib/links/apply';

interface QuickStartWizardProps {
  initialInfo: QuickStartInfo;
  templateId: string;
  base: Pick<SiteData, 'projectName' | 'slug'>;
  onFinish: (site: SiteData) => void;
  onClose?: () => void;
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

// One short form that writes the whole page. Style, color and sections are
// then adjusted right in the editor.
export default function QuickStartWizard({ initialInfo, templateId, base, onFinish, onClose }: QuickStartWizardProps) {
  const [info, setInfo] = React.useState(initialInfo);
  const [linksText, setLinksText] = React.useState('');
  const [building, setBuilding] = React.useState(false);

  const canContinue = info.name.trim().length > 0 && !building;
  const linkCount = extractUrls(linksText).length;

  const setInfoField = (key: 'name' | 'headline' | 'description' | 'link') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInfo(i => ({ ...i, [key]: e.target.value }));

  const finish = async () => {
    if (!canContinue) return;
    setBuilding(true);
    try {
      const previews = linkCount ? await resolveLinks(linksText) : [];
      // No description typed? Borrow one from their repo, app or website
      // (only real fetched text, not the generic fallback like "View the source on GitHub")
      const borrowed = previews.find(p => ['repo', 'app', 'page'].includes(p.kind) && p.description && p.description !== detectLink(p.url).description)?.description ?? '';
      const filled = { ...info, description: info.description.trim() || borrowed };
      const template = getTemplate(templateId);
      const site = buildQuickStartSite(filled, { templateId: template.id, accent: template.theme.accent, include: DEFAULT_INCLUDE }, base);
      onFinish(applyLinksToSite(site, previews).site);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="text-lg">🧱</span> Set up your page
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        ) : <span className="w-8" />}
      </div>

      <form
        className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-10"
        onSubmit={e => { e.preventDefault(); void finish(); }}
      >
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tell us about your product</h1>
          <p className="mt-2 text-gray-500">We’ll write your page from this. Then pick a style and tweak anything right on the page.</p>

          <div className="mt-8 space-y-6">
            <Field label="Product name">
              <input autoFocus required value={info.name} onChange={setInfoField('name')} placeholder="Acme" className={inputClass} />
            </Field>
            <Field label="What does it do?" hint="One line. This becomes your big headline.">
              <input value={info.headline} onChange={setInfoField('headline')} placeholder="Invoicing for freelancers that takes 10 seconds" className={inputClass} />
            </Field>
            <Field label="Tell people a bit more" hint="Optional. Who is it for and why will they love it?">
              <textarea
                rows={2}
                value={info.description}
                onChange={setInfoField('description')}
                placeholder="Send beautiful invoices, get paid faster, and never chase a client again."
                className={cn(inputClass, 'resize-none')}
              />
            </Field>

            <div>
              <span className="block text-sm font-semibold text-gray-900">What should your main button do?</span>
              <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
                {([
                  { goal: 'waitlist', icon: Mail, title: 'Collect emails', hint: 'A waitlist form. Not launched yet?' },
                  { goal: 'link', icon: Link2, title: 'Open a link', hint: 'Your app, sign-up or store page' },
                ] as const).map(option => (
                  <button
                    key={option.goal}
                    type="button"
                    role="radio"
                    aria-checked={info.goal === option.goal}
                    onClick={() => setInfo(i => ({ ...i, goal: option.goal }))}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition cursor-pointer',
                      info.goal === option.goal ? 'border-gray-900 bg-white' : 'border-gray-200 bg-white hover:border-gray-400',
                    )}
                  >
                    <option.icon className="mb-2 h-5 w-5 text-gray-900" />
                    <span className="block text-sm font-semibold text-gray-900">{option.title}</span>
                    <span className="block text-xs text-gray-500">{option.hint}</span>
                  </button>
                ))}
              </div>
              {info.goal === 'link' && (
                <input
                  value={info.link}
                  onChange={setInfoField('link')}
                  placeholder="app.acme.com/signup"
                  aria-label="Main button link"
                  className={cn(inputClass, 'mt-3')}
                />
              )}
            </div>

            <Field label="Your links" hint="Optional. One per line: GitHub, a demo video, App Store, X, LinkedIn, Discord… Each becomes a tile.">
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
            {building ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Building your page…</>
            ) : (
              <>Build my page <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
