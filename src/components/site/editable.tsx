'use client';

import * as React from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SiteLink } from '@/lib/site/types';

// How the site is being rendered: the live page, inside the editor, or as a
// non-interactive thumbnail (which must not contain real links)
export type RenderMode = 'view' | 'edit' | 'thumbnail';
export const RenderModeContext = React.createContext<RenderMode>('view');
export const useEditMode = () => React.useContext(RenderModeContext) === 'edit';
export const useIsThumbnail = () => React.useContext(RenderModeContext) === 'thumbnail';

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type TextTag = 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  as?: TextTag;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
}

// Plain text that becomes editable in place when in edit mode.
// Commits on blur so typing never fights React re-renders.
export function EditableText({ value, onChange, as = 'span', className, style, multiline, placeholder = 'Type something…' }: EditableTextProps) {
  const editable = useEditMode();
  const Tag = as as React.ElementType;

  if (!editable) {
    if (!value) return null;
    return <Tag className={cn(multiline && 'whitespace-pre-line', className)} style={style}>{value}</Tag>;
  }

  return (
    <Tag
      key={value}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      className={cn(
        'site-editable outline-none rounded-[4px] cursor-text transition-shadow',
        'hover:ring-1 hover:ring-[color-mix(in_srgb,var(--site-accent)_45%,transparent)]',
        'focus:ring-2 focus:ring-[var(--site-accent)] focus:ring-offset-2 focus:ring-offset-transparent',
        multiline && 'whitespace-pre-line',
        className,
      )}
      style={style}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onPaste={(e: React.ClipboardEvent) => {
        // Keep pasted content as plain text
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') e.currentTarget.blur();
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = (e.currentTarget.innerText || '').replace(/\n$/, '');
        if (next !== value) onChange(next);
      }}
    >
      {value}
    </Tag>
  );
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [ref, open, onClose]);
}

// Small editor-styled popover. Uses the app's own look, not the site theme.
export function EditorPopover({ open, onClose, children, className }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, onClose);
  if (!open) return null;
  return (
    <div
      ref={ref}
      onClick={e => e.stopPropagation()}
      className={cn(
        'editor-ui absolute z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 text-left text-sm text-gray-900 shadow-xl',
        className,
      )}
      style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >
      {children}
    </div>
  );
}

export function EditorField({ label, value, onChange, placeholder, autoFocus }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block mb-2 last:mb-0">
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      <input
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-gray-900"
      />
    </label>
  );
}

interface EditableLinkProps {
  link: SiteLink;
  onChange: (link: SiteLink) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onRemove?: () => void;
}

// A link or button. Visitors follow it; editors click it to change the text and URL.
export function EditableLink({ link, onChange, className, style, children, onRemove }: EditableLinkProps) {
  const editable = useEditMode();
  const thumbnail = useIsThumbnail();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(link);

  const href = normalizeUrl(link.url);
  const external = /^https?:/i.test(href);

  if (thumbnail) {
    return <span className={className} style={style}>{children ?? link.label}</span>;
  }

  if (!editable) {
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className={className} style={style}>
        {children ?? link.label}
      </a>
    );
  }

  const commit = () => {
    onChange({ ...draft, url: draft.url.trim() ? normalizeUrl(draft.url) : '#' });
    setOpen(false);
  };

  return (
    <span className="relative inline-flex">
      <a
        href={href}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setDraft(link);
          setOpen(true);
        }}
        className={cn(className, 'cursor-pointer hover:outline-2 hover:outline-offset-2 hover:outline-[var(--site-accent)]')}
        style={style}
        title="Click to edit link"
      >
        {children ?? link.label}
      </a>
      <EditorPopover open={open} onClose={commit} className="top-full left-0">
        <EditorField label="Text" value={draft.label} onChange={label => setDraft({ ...draft, label })} autoFocus />
        <EditorField label="Link" value={draft.url} placeholder="https://… or #section" onChange={url => setDraft({ ...draft, url })} />
        <div className="mt-3 flex items-center justify-between">
          {onRemove ? (
            <button className="text-xs text-red-600 hover:underline cursor-pointer" onClick={() => { setOpen(false); onRemove(); }}>
              Remove
            </button>
          ) : <span />}
          <button className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white cursor-pointer" onClick={commit}>
            Done
          </button>
        </div>
      </EditorPopover>
    </span>
  );
}

// Image by URL. Shows a friendly placeholder in the editor when empty.
export function EditableImage({ url, onChange, alt, className, placeholderClassName }: {
  url: string;
  onChange: (url: string) => void;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}) {
  const editable = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(url);
  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  if (!editable) {
    if (!url) return null;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={className} />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="block w-full cursor-pointer text-left"
        onClick={e => { e.stopPropagation(); setDraft(url); setOpen(true); }}
        title="Click to change image"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} className={cn(className, 'hover:opacity-90')} />
        ) : (
          <div className={cn(
            'flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--site-border)] text-[var(--site-muted)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] transition-colors',
            placeholderClassName,
          )}>
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm font-medium">Add an image</span>
          </div>
        )}
      </button>
      <EditorPopover open={open} onClose={close} className="top-0 left-1/2 -translate-x-1/2">
        <EditorField label="Image URL" value={draft} placeholder="https://…/screenshot.png" onChange={setDraft} autoFocus />
        <p className="text-xs text-gray-500 mb-3">Paste a link to a screenshot, GIF or product image.</p>
        <div className="flex items-center justify-between">
          <button className="text-xs text-red-600 hover:underline cursor-pointer" onClick={() => { onChange(''); setOpen(false); }}>
            Remove
          </button>
          <button className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white cursor-pointer" onClick={() => { onChange(draft.trim()); setOpen(false); }}>
            Save
          </button>
        </div>
      </EditorPopover>
    </div>
  );
}

// Dashed "add another" button, only rendered in edit mode
export function AddItemButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  const editable = useEditMode();
  if (!editable) return null;
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={cn(
        'flex items-center justify-center gap-2 rounded-[var(--site-radius)] border-2 border-dashed border-[var(--site-border)] p-4 text-sm font-medium text-[var(--site-muted)] transition-colors hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] cursor-pointer',
        className,
      )}
    >
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

// Little × in the corner of a list item, visible on hover in edit mode
export function RemoveItemButton({ onClick, label = 'Remove' }: { onClick: () => void; label?: string }) {
  const editable = useEditMode();
  if (!editable) return null;
  return (
    <button
      type="button"
      title={label}
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="editor-ui absolute -right-2 -top-2 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:text-red-600 group-hover/item:flex cursor-pointer"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

// Helpers for immutable list edits
export function replaceAt<T>(list: T[], index: number, item: T): T[] {
  return list.map((existing, i) => (i === index ? item : existing));
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}
