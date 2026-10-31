'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableText, SiteSlugContext, useEditMode, useIsThumbnail } from './editable';

interface WaitlistFormProps {
  buttonLabel: string;
  onButtonLabelChange: (label: string) => void;
  // 'page' sits on the page background; 'accent' sits on the accent-colored CTA band
  tone?: 'page' | 'accent';
  center?: boolean;
}

// Email sign-up form. Visitors join the page's waitlist; in the editor the
// button text is editable and the form doesn't submit.
export function WaitlistForm({ buttonLabel, onButtonLabelChange, tone = 'page', center }: WaitlistFormProps) {
  const editable = useEditMode();
  const thumbnail = useIsThumbnail();
  const slug = React.useContext(SiteSlugContext);
  const [email, setEmail] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = React.useState('');

  const onAccent = tone === 'accent';

  if (status === 'done') {
    return (
      <p className={cn('inline-flex items-center gap-2 rounded-[var(--site-radius)] px-4 py-3 text-sm font-semibold', onAccent ? 'bg-white/15' : 'bg-[color-mix(in_srgb,var(--site-accent)_12%,transparent)] text-[var(--site-fg)]')} role="status">
        <Check className="h-4 w-4" /> {message}
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editable || thumbnail || status === 'sending') return;
    // The no-account playground has no page to save to yet
    if (!slug) {
      setMessage('You’re on the list! (Demo: sign-ups are saved once your page is published.)');
      setStatus('done');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email, website }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
      setMessage(result.already ? 'You’re already on the list. We’ll be in touch!' : 'You’re on the list! We’ll be in touch.');
      setStatus('done');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className={cn('w-full max-w-md', center && 'mx-auto')} noValidate={editable}>
      <div className={cn('flex flex-col gap-2 rounded-[calc(var(--site-radius)+4px)] p-1.5 @md:flex-row', onAccent ? 'bg-white/15' : 'border border-[var(--site-border)] bg-[var(--site-card)]')}>
        <input
          type="email"
          required
          readOnly={editable || thumbnail}
          tabIndex={editable || thumbnail ? -1 : undefined}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          autoComplete="email"
          className={cn(
            'min-w-0 flex-1 rounded-[var(--site-radius)] bg-transparent px-3 py-2.5 text-sm outline-none',
            onAccent ? 'text-[var(--site-accent-fg)] placeholder:text-[var(--site-accent-fg)] placeholder:opacity-70' : 'text-[var(--site-fg)] placeholder:text-[var(--site-muted)]',
          )}
        />
        {/* Spam trap: hidden from people, filled in by bots */}
        <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={status === 'sending'}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-[var(--site-radius)] px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 cursor-pointer',
            onAccent ? 'bg-[var(--site-accent-fg)] text-[var(--site-accent)]' : 'bg-[var(--site-accent)] text-[var(--site-accent-fg)]',
          )}
        >
          {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
          <EditableText value={buttonLabel} onChange={onButtonLabelChange} placeholder="Join the waitlist" />
        </button>
      </div>
      {status === 'error' && <p className="mt-2 text-sm" role="alert">{message}</p>}
    </form>
  );
}
