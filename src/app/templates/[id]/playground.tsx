'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket, X } from 'lucide-react';
import { createSiteFromTemplate } from '@/lib/site/templates';
import { loadDraft, saveDraft } from '@/lib/site/draft-storage';
import type { SiteData } from '@/lib/site/types';
import { PAGE_HOST, slugProblem, toSlug } from '@/lib/slug';
import SiteEditor from '@/components/site/SiteEditor';
import { useSiteHistory } from '@/components/site/use-site-history';
import { AddressMessage, canClaim, useAddressCheck } from '@/components/address-form';

// "acme-invoices" -> "Acme Invoices"
const nameFromAddress = (address: string) => address.split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

// Try the builder without an account. The page is kept in this browser and
// carried through sign-up when the user publishes.
export default function TemplatePlayground({ templateId }: { templateId: string }) {
  // Client-only: the saved draft and the claimed address (?slug=) live in the browser
  const [initial, setInitial] = useState<{ site: SiteData; restored: boolean; address?: string } | null>(null);
  useEffect(() => {
    const param = toSlug(new URLSearchParams(window.location.search).get('slug') ?? '');
    const claimed = param && !slugProblem(param) ? param : undefined;
    const draft = loadDraft();
    if (draft && draft.origin === templateId) {
      // The playground page has no address yet (a set one would make its waitlist form try to save)
      setInitial({ site: { ...draft.site, slug: undefined }, restored: true, address: claimed ?? draft.address });
    } else {
      // Start with the product name taken from the address, so setup is pre-filled
      setInitial({ site: createSiteFromTemplate(templateId, claimed ? nameFromAddress(claimed) : 'Acme'), restored: false, address: claimed });
    }
  }, [templateId]);

  if (!initial) return null;
  return <Playground initialSite={initial.site} restored={initial.restored} origin={templateId} address={initial.address} />;
}

function Playground({ initialSite, restored, origin, address }: { initialSite: SiteData; restored: boolean; origin: string; address?: string }) {
  const { site, setSite, undo, redo, canUndo, canRedo } = useSiteHistory(initialSite);
  const [publishing, setPublishing] = useState(false);

  // Keep the draft as the user edits
  useEffect(() => {
    if (site !== initialSite || restored) saveDraft(site, { origin, address });
  }, [site, initialSite, restored, origin, address]);

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
        backHref="/"
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
      {publishing && <PublishDialog site={site} origin={origin} address={address} onClose={() => setPublishing(false)} />}
    </>
  );
}

// Confirm the page address, then create a free account to go live
function PublishDialog({ site, origin, address, onClose }: { site: SiteData; origin: string; address?: string; onClose: () => void }) {
  const router = useRouter();
  const nav = site.sections.find(s => s.type === 'navbar');
  const [slug, setSlug] = useState(() => address ?? toSlug(nav?.type === 'navbar' ? nav.logo : site.projectName));
  const status = useAddressCheck(slug);
  const clean = slug.replace(/-+$/, '');

  const proceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canClaim(status)) return;
    saveDraft({ ...site, slug: clean }, { publish: true, origin, address: clean });
    router.push(`/auth/signup?slug=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form onSubmit={proceed} onMouseDown={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Publish your page</h2>
            <p className="text-sm text-gray-500">Confirm your address, then create a free account and your page goes live.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 focus-within:border-gray-900">
          <span className="border-r border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">{PAGE_HOST}/</span>
          <input
            autoFocus
            value={slug}
            onChange={e => setSlug(toSlug(e.target.value))}
            placeholder="your-product"
            aria-label="Page address"
            className="min-w-0 flex-1 px-3 py-3 text-sm outline-none"
          />
        </div>
        <AddressMessage status={status} className="mt-2" />
        <button
          type="submit"
          disabled={!canClaim(status)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {status === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Continue: create free account
        </button>
      </form>
    </div>
  );
}
