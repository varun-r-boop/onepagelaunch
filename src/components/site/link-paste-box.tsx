'use client';

import * as React from 'react';
import { Link2, Loader2, Plus } from 'lucide-react';
import { extractUrls } from '@/lib/links/detect';
import { useEditMode } from './editable';

// Editor-only actions that need the whole site (e.g. adding socials to the footer)
export interface SiteActions {
  addLinks: (text: string, sectionId?: string) => Promise<void>;
}
export const SiteActionsContext = React.createContext<SiteActions | null>(null);

// "Paste a link" tile at the end of a bento grid. Pasting one or many links
// turns each into a tile automatically.
export function LinkPasteBox({ sectionId, onAddBlank }: { sectionId: string; onAddBlank: () => void }) {
  const editable = useEditMode();
  const actions = React.useContext(SiteActionsContext);
  const [value, setValue] = React.useState('');
  const [pending, setPending] = React.useState(0);

  if (!editable || !actions) return null;

  const submit = async (text: string) => {
    const count = extractUrls(text).length;
    if (count === 0) return;
    setPending(count);
    setValue('');
    try {
      await actions.addLinks(text, sectionId);
    } finally {
      setPending(0);
    }
  };

  return (
    <div
      className="editor-ui flex min-h-[190px] flex-col justify-center gap-3 rounded-[var(--site-radius)] border-2 border-dashed border-[var(--site-border)] p-5 text-[var(--site-muted)] transition-colors focus-within:border-[var(--site-accent)] hover:border-[var(--site-accent)] @xl:col-span-2"
      onClick={e => e.stopPropagation()}
    >
      {pending ? (
        <p className="flex items-center justify-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin" /> Adding {pending} {pending === 1 ? 'link' : 'links'}…
        </p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--site-fg)]">
            <Link2 className="h-4 w-4" /> Paste a link
          </label>
          <form
            className="flex gap-2"
            onSubmit={e => { e.preventDefault(); void submit(value); }}
          >
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onPaste={e => {
                const text = e.clipboardData.getData('text/plain');
                if (extractUrls(text).length) {
                  e.preventDefault();
                  void submit(text);
                }
              }}
              placeholder="GitHub, YouTube, App Store, X, Discord, your site…"
              className="min-w-0 flex-1 rounded-[calc(var(--site-radius)*0.6)] border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2 text-sm text-[var(--site-fg)] outline-none placeholder:text-[var(--site-muted)] focus:border-[var(--site-accent)]"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="rounded-[calc(var(--site-radius)*0.6)] bg-[var(--site-accent)] px-3 py-2 text-sm font-semibold text-[var(--site-accent-fg)] disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              Add
            </button>
          </form>
          <p className="text-xs">Paste several at once to add them all. Social profiles also go in your footer.</p>
          <button type="button" onClick={onAddBlank} className="flex items-center gap-1 self-start text-xs font-medium hover:text-[var(--site-accent)] cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> or add a blank tile
          </button>
        </>
      )}
    </div>
  );
}
