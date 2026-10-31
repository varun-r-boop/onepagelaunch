'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Droplet, Link2, Smile, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SITE_ICONS } from '@/lib/site/icons';
import type { BentoTile, TileKind, TileSize } from '@/lib/site/types';
import { resolveLinks } from '@/lib/links/client';
import { tileFromPreview } from '@/lib/links/detect';
import { EditorField, EditorPopover, normalizeUrl, useEditMode } from './editable';

const SIZES: { size: TileSize; label: string; w: number; h: number }[] = [
  { size: 'sm', label: 'Small', w: 1, h: 1 },
  { size: 'wide', label: 'Wide', w: 2, h: 1 },
  { size: 'tall', label: 'Tall', w: 1, h: 2 },
  { size: 'lg', label: 'Large', w: 2, h: 2 },
];

const KINDS: { kind: TileKind; label: string }[] = [
  { kind: 'feature', label: 'Feature' },
  { kind: 'stat', label: 'Stat' },
  { kind: 'image', label: 'Image' },
  { kind: 'quote', label: 'Quote' },
  { kind: 'link', label: 'Link' },
  { kind: 'video', label: 'Video' },
];

const iconButton = 'flex h-7 w-7 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer';

export function TileControls({ tile, onChange, onRemove, onMove }: {
  tile: BentoTile;
  onChange: (tile: BentoTile) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const editable = useEditMode();
  const [panel, setPanel] = React.useState<'icon' | 'link' | null>(null);
  const [url, setUrl] = React.useState(tile.url ?? '');
  const [loading, setLoading] = React.useState(false);
  const close = React.useCallback(() => setPanel(null), []);

  // A new link refreshes the tile's title, image and details from that link
  const saveUrl = async () => {
    setPanel(null);
    const next = normalizeUrl(url);
    if (next === tile.url) return;
    setLoading(true);
    try {
      const [preview] = await resolveLinks(next);
      const fresh = preview ? tileFromPreview(preview, tile.size) : null;
      onChange(fresh ? { ...fresh, id: tile.id, accent: tile.accent } : { ...tile, url: next });
    } finally {
      setLoading(false);
    }
  };

  if (!editable) return null;
  const hasIcon = tile.kind === 'feature' || (tile.kind === 'link' && !tile.iconUrl);
  const hasUrl = tile.kind === 'link' || tile.kind === 'video' || (tile.kind === 'quote' && !!tile.url);

  return (
    <div
      className={cn(
        'editor-ui absolute right-2 top-2 z-30 items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 text-gray-900 shadow-lg',
        panel ? 'flex' : 'hidden group-hover/tile:flex',
      )}
      style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
      onClick={e => e.stopPropagation()}
    >
      <select
        value={tile.kind}
        onChange={e => onChange({ ...tile, kind: e.target.value as TileKind })}
        className="h-7 rounded-md border-none bg-transparent px-1 text-xs font-medium outline-none hover:bg-gray-100 cursor-pointer"
        title="Tile type"
      >
        {KINDS.map(k => <option key={k.kind} value={k.kind}>{k.label}</option>)}
      </select>
      <span className="mx-0.5 h-5 w-px bg-gray-200" />
      {SIZES.map(s => (
        <button
          key={s.size}
          type="button"
          title={s.label}
          onClick={() => onChange({ ...tile, size: s.size })}
          className={cn(iconButton, tile.size === s.size && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white')}
        >
          <span
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${s.w}, 5px)`, gridTemplateRows: `repeat(${s.h}, 5px)` }}
          >
            {Array.from({ length: s.w * s.h }).map((_, i) => <span key={i} className="rounded-[1px] bg-current" />)}
          </span>
        </button>
      ))}
      <span className="mx-0.5 h-5 w-px bg-gray-200" />
      {hasIcon && (
        <button type="button" title="Icon" className={iconButton} onClick={() => setPanel(panel === 'icon' ? null : 'icon')}>
          <Smile className="h-4 w-4" />
        </button>
      )}
      {hasUrl && (
        <button type="button" title="Link URL" className={iconButton} onClick={() => { setUrl(tile.url ?? ''); setPanel(panel === 'link' ? null : 'link'); }}>
          <Link2 className={cn('h-4 w-4', loading && 'animate-pulse')} />
        </button>
      )}
      <button
        type="button"
        title={tile.accent ? 'Use card color' : 'Use accent color'}
        className={cn(iconButton, tile.accent && 'text-indigo-600')}
        onClick={() => onChange({ ...tile, accent: !tile.accent })}
      >
        <Droplet className={cn('h-4 w-4', tile.accent && 'fill-current')} />
      </button>
      <button type="button" title="Move earlier" className={iconButton} onClick={() => onMove(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" title="Move later" className={iconButton} onClick={() => onMove(1)}>
        <ChevronRight className="h-4 w-4" />
      </button>
      <button type="button" title="Delete tile" className={cn(iconButton, 'hover:text-red-600')} onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </button>

      <EditorPopover open={panel === 'icon'} onClose={close} className="right-0 top-full">
        <p className="mb-2 text-xs font-medium text-gray-500">Choose an icon</p>
        <div className="grid grid-cols-6 gap-1">
          {Object.entries(SITE_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              title={key}
              onClick={() => { onChange({ ...tile, icon: key }); setPanel(null); }}
              className={cn('flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer', tile.icon === key && 'bg-gray-900 text-white hover:bg-gray-900')}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </EditorPopover>

      <EditorPopover open={panel === 'link'} onClose={() => void saveUrl()} className="right-0 top-full">
        <EditorField label="Link" value={url} placeholder="https://github.com/you" onChange={setUrl} autoFocus />
        <p className="mb-2 text-xs text-gray-500">The tile updates from the link (title, image, stars…).</p>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
            onClick={() => void saveUrl()}
          >
            Save
          </button>
        </div>
      </EditorPopover>
    </div>
  );
}
