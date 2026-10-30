'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket, X } from 'lucide-react';
import { createSiteFromTemplate } from '@/lib/site/templates';
import { loadDraft, saveDraft } from '@/lib/site/draft-storage';
import type { SiteData } from '@/lib/site/types';
import SiteEditor from '@/components/site/SiteEditor';
import { useSiteHistory } from '@/components/site/use-site-history';

// Try the builder without an account. The page is kept in this browser and
// carried through sign-up when the user publishes.
export default function TemplatePlayground({ templateId }: { templateId: string }) {
  // Client-only: the saved draft lives in localStorage
  const [initial, setInitial] = useState<{ site: SiteData; restored: boolean } | null>(null);
  useEffect(() => {
    const draft = loadDraft();
    setInitial(
      draft && draft.origin === templateId
        ? { site: draft.site, restored: true }
        : { site: createSiteFromTemplate(templateId, 'Acme'), restored: false },
    );
  }, [templateId]);

  if (!initial) return null;
  return <Playground initialSite={initial.site} restored={initial.restored} origin={templateId} />;
}

function Playground({ initialSite, restored, origin }: { initialSite: SiteData; restored: boolean; origin: string }) {
  const { site, setSite, undo, redo, canUndo, canRedo } = useSiteHistory(initialSite);
  const [publishing, setPublishing] = useState(false);

  // Keep the draft as the user edits
  useEffect(() => {
    if (site !== initialSite || restored) saveDraft(site, false, origin);
  }, [site, initialSite, restored, origin]);

  return (
    <>
      <SiteEditor
        site={site}
        onChange={setSite}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        saveStatus="local"
        backHref="/templates"
        openSetupOnLoad={!restored}
        primaryAction={
          <button
            type="button"
            onClick={() => setPublishing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer"
          >
            <Rocket className="h-4 w-4" /> Publish
          </button>
        }
      />
      {publishing && <PublishDialog site={site} origin={origin} onClose={() => setPublishing(false)} />}
    </>
  );
}

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

// Pick the page address, then create a free account to go live
function PublishDialog({ site, origin, onClose }: { site: SiteData; origin: string; onClose: () => void }) {
  const router = useRouter();
  const nav = site.sections.find(s => s.type === 'navbar');
  const [slug, setSlug] = useState(() => toSlug(nav?.type === 'navbar' ? nav.logo : site.projectName));
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!slug) { setAvailable(null); return; }
    setChecking(true);
    const handle = setTimeout(async () => {
      try {
        // 404 means nobody has this address yet
        const res = await fetch(`/api/projects/public/${encodeURIComponent(slug)}`);
        setAvailable(res.status === 404);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [slug]);

  const proceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !available) return;
    saveDraft({ ...site, slug }, true, origin);
    router.push(`/auth/signup?slug=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form onSubmit={proceed} onMouseDown={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Publish your page</h2>
            <p className="text-sm text-gray-500">Choose your address. Then create a free account and your page goes live.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 focus-within:border-gray-900">
          <span className="border-r border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">onepagelaunch.vercel.app/</span>
          <input
            autoFocus
            value={slug}
            onChange={e => setSlug(toSlug(e.target.value))}
            placeholder="your-product"
            aria-label="Page address"
            className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
          />
        </div>
        <p className="mt-2 h-5 text-sm">
          {checking ? <span className="text-gray-500">Checking…</span>
            : available === true ? <span className="text-green-600">✓ Available</span>
              : available === false ? <span className="text-red-600">Taken. Try another.</span> : null}
        </p>
        <button
          type="submit"
          disabled={!slug || !available || checking}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Continue: create free account
        </button>
      </form>
    </div>
  );
}
