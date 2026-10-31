'use client';

import * as React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PAGE_HOST, slugProblem, toSlug } from '@/lib/slug';

export type AddressStatus = 'empty' | 'short' | 'invalid' | 'reserved' | 'checking' | 'available' | 'taken' | 'unknown';

// Checks a page address as the user types (debounced)
export function useAddressCheck(slug: string): AddressStatus {
  const [status, setStatus] = React.useState<AddressStatus>('empty');
  React.useEffect(() => {
    if (!slug) { setStatus('empty'); return; }
    const problem = slugProblem(slug.replace(/-+$/, ''));
    if (problem) { setStatus(problem); return; }
    setStatus('checking');
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        // 404 means nobody has this address yet
        const res = await fetch(`/api/projects/public/${encodeURIComponent(slug.replace(/-+$/, ''))}`);
        if (!cancelled) setStatus(res.status === 404 ? 'available' : res.ok ? 'taken' : 'unknown');
      } catch {
        if (!cancelled) setStatus('unknown');
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [slug]);
  return status;
}

const MESSAGES: Partial<Record<AddressStatus, { text: string; tone: 'muted' | 'good' | 'bad' }>> = {
  short: { text: 'Use at least 3 letters or numbers', tone: 'muted' },
  invalid: { text: 'Letters, numbers and dashes only', tone: 'bad' },
  reserved: { text: 'That address is reserved. Try another.', tone: 'bad' },
  checking: { text: 'Checking…', tone: 'muted' },
  available: { text: '✓ Available', tone: 'good' },
  taken: { text: 'Already taken. Try another.', tone: 'bad' },
};

// Whether the user may continue with this address (an unknown result is checked again at publish)
export const canClaim = (status: AddressStatus) => status === 'available' || status === 'unknown';

export function AddressMessage({ status, className }: { status: AddressStatus; className?: string }) {
  const message = MESSAGES[status];
  return (
    <p className={cn('h-5 text-sm', className)} aria-live="polite">
      {message && (
        <span className={message.tone === 'good' ? 'text-green-600' : message.tone === 'bad' ? 'text-red-600' : 'text-gray-500'}>
          {message.text}
        </span>
      )}
    </p>
  );
}

// "onepagelaunch.vercel.app/[your-product] [Get started]" — the first step of building a page
export function AddressForm({ onClaim, buttonLabel = 'Get started', autoFocus, className }: {
  onClaim: (slug: string) => void;
  buttonLabel?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [slug, setSlug] = React.useState('');
  const status = useAddressCheck(slug);
  const clean = slug.replace(/-+$/, '');

  return (
    <form
      className={cn('w-full', className)}
      onSubmit={e => {
        e.preventDefault();
        if (canClaim(status)) onClaim(clean);
      }}
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-indigo-500/5 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 items-center pl-3 text-base">
          <span className="shrink-0 text-gray-400">{PAGE_HOST}/</span>
          <input
            autoFocus={autoFocus}
            value={slug}
            onChange={e => setSlug(toSlug(e.target.value))}
            placeholder="your-product"
            aria-label="Your page address"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-2.5 font-medium text-gray-900 outline-none placeholder:text-gray-300"
          />
        </label>
        <button
          type="submit"
          disabled={!canClaim(status)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {status === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonLabel} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <AddressMessage status={status} className="mt-2 pl-3 text-left" />
    </form>
  );
}
