'use client';

import * as React from 'react';
import { ArrowUpRight, Check, ChevronDown, Play, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSiteIcon } from '@/lib/site/icons';
import { isAllowedEmbed } from '@/lib/links/detect';
import { link as newLink, newFaq, newPlan, newTestimonial, newTile } from '@/lib/site/sections';
import type {
  BentoSection, BentoTile, CtaSection, FaqSection, FooterSection, HeroSection, LogosSection,
  NavbarSection, PricingSection, Section, TestimonialsSection, TileSize,
} from '@/lib/site/types';
import {
  AddItemButton, EditableImage, EditableLink, EditableText, RemoveItemButton, normalizeUrl, removeAt, replaceAt, useEditMode, useIsThumbnail,
} from './editable';
import { LinkPasteBox } from './link-paste-box';
import { TileControls } from './tile-controls';

interface SectionProps<T extends Section> {
  section: T;
  onChange: (section: T) => void;
}

const container = 'mx-auto w-full max-w-6xl px-5 @3xl:px-8';
const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-[var(--site-radius)] bg-[var(--site-accent)] px-5 py-3 text-sm font-semibold text-[var(--site-accent-fg)] shadow-sm transition hover:opacity-90';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-card)] px-5 py-3 text-sm font-semibold text-[var(--site-fg)] transition hover:border-[var(--site-muted)]';
const card = 'rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-card)]';

function SectionHeading({ eyebrow, title, subtitle, onChange }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onChange: (patch: { eyebrow?: string; title?: string; subtitle?: string }) => void;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow !== undefined && (
        <EditableText
          as="p"
          value={eyebrow}
          placeholder="Eyebrow"
          onChange={v => onChange({ eyebrow: v })}
          className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--site-accent)]"
        />
      )}
      <EditableText as="h2" value={title} onChange={v => onChange({ title: v })} className="text-3xl font-bold tracking-tight @3xl:text-5xl" />
      {subtitle !== undefined && (
        <EditableText
          as="p"
          value={subtitle}
          placeholder="Optional subtitle"
          onChange={v => onChange({ subtitle: v })}
          className="mt-4 text-lg text-[var(--site-muted)]"
        />
      )}
    </div>
  );
}

// ---------- Navbar ----------

function NavbarView({ section, onChange }: SectionProps<NavbarSection>) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--site-border)] bg-[color-mix(in_srgb,var(--site-bg)_80%,transparent)] backdrop-blur-md">
      <div className={cn(container, 'flex h-16 items-center justify-between gap-4')}>
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-[calc(var(--site-radius)/2)] bg-[var(--site-accent)]" />
          <EditableText value={section.logo} onChange={logo => onChange({ ...section, logo })} className="text-lg font-bold tracking-tight" />
        </div>
        <nav className="hidden items-center gap-7 text-sm text-[var(--site-muted)] @3xl:flex">
          {section.links.map((l, i) => (
            <EditableLink
              key={l.id}
              link={l}
              className="hover:text-[var(--site-fg)] transition-colors"
              onChange={next => onChange({ ...section, links: replaceAt(section.links, i, next) })}
              onRemove={() => onChange({ ...section, links: removeAt(section.links, i) })}
            />
          ))}
          <AddItemButton label="Link" className="border-1 px-2 py-1 text-xs" onClick={() => onChange({ ...section, links: [...section.links, newLink('Link', '#')] })} />
        </nav>
        <EditableLink link={section.cta} onChange={cta => onChange({ ...section, cta })} className={cn(primaryButton, 'px-4 py-2')} />
      </div>
    </header>
  );
}

// ---------- Hero ----------

function HeroView({ section, onChange }: SectionProps<HeroSection>) {
  const editable = useEditMode();
  const centered = section.align === 'center';
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px]"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 30%, var(--site-glow), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'linear-gradient(var(--site-border) 1px, transparent 1px), linear-gradient(90deg, var(--site-border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent 75%)',
        }}
      />
      <div className={cn(container, 'relative pt-20 pb-16 @3xl:pt-28 @3xl:pb-24', centered ? 'text-center' : 'text-left')}>
        {(section.badge || editable) && (
          <div className={cn('mb-6 flex', centered ? 'justify-center' : 'justify-start')}>
            <EditableText
              value={section.badge}
              placeholder="Badge (optional)"
              onChange={badge => onChange({ ...section, badge })}
              className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-card)] px-3 py-1 text-xs font-medium text-[var(--site-muted)]"
            />
          </div>
        )}
        <EditableText
          as="h1"
          value={section.title}
          onChange={title => onChange({ ...section, title })}
          className={cn('text-4xl font-extrabold leading-[1.05] tracking-tight @3xl:text-6xl @5xl:text-7xl', centered ? 'mx-auto max-w-4xl' : 'max-w-3xl')}
        />
        <EditableText
          as="p"
          multiline
          value={section.subtitle}
          onChange={subtitle => onChange({ ...section, subtitle })}
          className={cn('mt-6 text-lg text-[var(--site-muted)] @3xl:text-xl', centered ? 'mx-auto max-w-2xl' : 'max-w-2xl')}
        />
        <div className={cn('mt-10 flex flex-wrap gap-3', centered ? 'justify-center' : 'justify-start')}>
          <EditableLink link={section.primary} onChange={primary => onChange({ ...section, primary })} className={primaryButton} />
          {section.showSecondary && (
            <EditableLink
              link={section.secondary}
              onChange={secondary => onChange({ ...section, secondary })}
              onRemove={() => onChange({ ...section, showSecondary: false })}
              className={secondaryButton}
            />
          )}
        </div>
        {(section.imageUrl || editable) && (
          <div className="relative mt-16 @3xl:mt-20">
            <div className={cn(card, 'overflow-hidden p-2 shadow-2xl')}>
              <EditableImage
                url={section.imageUrl}
                alt={section.title}
                onChange={imageUrl => onChange({ ...section, imageUrl })}
                className="w-full rounded-[calc(var(--site-radius)-6px)]"
                placeholderClassName="aspect-[16/7] w-full rounded-[calc(var(--site-radius)-6px)]"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Logos ----------

function LogosView({ section, onChange }: SectionProps<LogosSection>) {
  return (
    <section className="py-12">
      <div className={container}>
        <EditableText
          as="p"
          value={section.title}
          onChange={title => onChange({ ...section, title })}
          className="mb-8 text-center text-sm font-medium text-[var(--site-muted)]"
        />
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {section.logos.map((logo, i) => (
            <div key={logo.id} className="group/item relative">
              <EditableText
                value={logo.label}
                onChange={label => onChange({ ...section, logos: replaceAt(section.logos, i, { ...logo, label }) })}
                className="text-xl font-bold tracking-tight text-[var(--site-muted)] opacity-70"
              />
              <RemoveItemButton onClick={() => onChange({ ...section, logos: removeAt(section.logos, i) })} />
            </div>
          ))}
          <AddItemButton label="Logo" className="px-3 py-1.5" onClick={() => onChange({ ...section, logos: [...section.logos, newLink('Company')] })} />
        </div>
      </div>
    </section>
  );
}

// ---------- Bento ----------

const tileSizeClass: Record<TileSize, string> = {
  sm: '',
  wide: '@xl:col-span-2',
  tall: '@xl:row-span-2',
  lg: '@xl:col-span-2 @xl:row-span-2',
};

// Remote images from pasted links can disappear; hide them instead of showing a broken icon
function RemoteImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className={className} onError={() => setFailed(true)} />;
}

function TileView({ tile, onChange }: { tile: BentoTile; onChange: (tile: BentoTile) => void }) {
  const Icon = getSiteIcon(tile.icon);
  const accent = tile.accent;
  const big = tile.size === 'lg' || tile.size === 'tall';
  const tone = accent ? 'text-[var(--site-accent-fg)]' : '';
  const mutedTone = accent ? 'text-[var(--site-accent-fg)] opacity-80' : 'text-[var(--site-muted)]';

  const set = (patch: Partial<BentoTile>) => onChange({ ...tile, ...patch });
  const editable = useEditMode();
  const thumbnail = useIsThumbnail();
  // Iframes would swallow clicks in the editor and are heavy in thumbnails
  const playable = !editable && !thumbnail;

  let body: React.ReactNode;
  switch (tile.kind) {
    case 'stat':
      body = (
        <div className="flex h-full flex-col justify-end">
          <EditableText value={tile.title} onChange={title => set({ title })} className={cn('font-extrabold tracking-tight', big ? 'text-7xl' : 'text-5xl', tone)} as="p" />
          <EditableText value={tile.body} onChange={b => set({ body: b })} className={cn('mt-2 text-sm', mutedTone)} as="p" />
        </div>
      );
      break;
    case 'image':
      body = (
        <div className="flex h-full flex-col gap-3">
          <div className="min-h-0 flex-1 overflow-hidden rounded-[calc(var(--site-radius)-8px)]">
            <EditableImage
              url={tile.imageUrl ?? ''}
              alt={tile.title}
              onChange={imageUrl => set({ imageUrl })}
              className="h-full w-full object-cover"
              placeholderClassName="h-full min-h-40 w-full rounded-[calc(var(--site-radius)-8px)]"
            />
          </div>
          <EditableText value={tile.title} placeholder="Caption" onChange={title => set({ title })} className={cn('text-sm font-medium', mutedTone)} as="p" />
        </div>
      );
      break;
    case 'quote':
      body = (
        <div className="flex h-full flex-col justify-between gap-6">
          <Quote className={cn('h-6 w-6', accent ? tone : 'text-[var(--site-accent)]')} />
          <EditableText value={tile.body} multiline onChange={b => set({ body: b })} className={cn('text-xl font-medium leading-snug', tone)} as="p" />
          <EditableText value={tile.title} onChange={title => set({ title })} className={cn('text-sm', mutedTone)} as="p" />
        </div>
      );
      break;
    case 'link': {
      const showImage = !!tile.imageUrl && tile.size !== 'sm';
      body = (
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between">
            {tile.iconUrl ? (
              <RemoteImage src={tile.iconUrl} className="h-11 w-11 rounded-[calc(var(--site-radius)*0.7)] border border-[var(--site-border)] bg-white object-cover" />
            ) : (
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-[calc(var(--site-radius)*0.7)]', accent ? 'bg-black/15' : 'bg-[var(--site-bg)] border border-[var(--site-border)]')}>
                <Icon className={cn('h-5 w-5', tone)} />
              </span>
            )}
            <ArrowUpRight className={cn('h-5 w-5 transition group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5', mutedTone)} />
          </div>
          {showImage && (
            <div className="min-h-0 flex-1 overflow-hidden rounded-[calc(var(--site-radius)*0.6)] border border-[var(--site-border)]">
              <RemoteImage src={tile.imageUrl!} className="h-full max-h-60 w-full object-cover" />
            </div>
          )}
          <div className={cn(!showImage && 'mt-auto')}>
            <EditableText value={tile.title} onChange={title => set({ title })} className={cn('text-lg font-semibold', tone)} as="p" />
            <EditableText value={tile.body} onChange={b => set({ body: b })} className={cn('line-clamp-3 text-sm', mutedTone)} as="p" />
            {tile.meta && <p className={cn('mt-2 text-xs font-medium', mutedTone)}>{tile.meta}</p>}
          </div>
        </div>
      );
      break;
    }
    case 'video': {
      const embed = isAllowedEmbed(tile.embedUrl) ? tile.embedUrl : undefined;
      body = (
        <div className="flex h-full flex-col gap-3">
          <div className="relative aspect-video w-full flex-1 overflow-hidden rounded-[calc(var(--site-radius)*0.6)] bg-black">
            {playable && embed ? (
              <iframe
                src={embed}
                title={tile.title || 'Video'}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <>
                {tile.imageUrl && <RemoteImage src={tile.imageUrl} className="absolute inset-0 h-full w-full object-cover opacity-90" />}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Play className="ml-0.5 h-6 w-6 fill-black text-black" />
                  </span>
                </span>
              </>
            )}
          </div>
          <EditableText value={tile.title} placeholder="Video title" onChange={title => set({ title })} className={cn('text-sm font-semibold', tone)} as="p" />
        </div>
      );
      break;
    }
    default:
      body = (
        <div className={cn('flex h-full flex-col gap-4', big && 'justify-between')}>
          <span className={cn('flex h-11 w-11 items-center justify-center rounded-[calc(var(--site-radius)*0.7)]', accent ? 'bg-black/15' : 'bg-[color-mix(in_srgb,var(--site-accent)_14%,transparent)]')}>
            <Icon className={cn('h-5 w-5', accent ? tone : 'text-[var(--site-accent)]')} />
          </span>
          <div>
            <EditableText value={tile.title} onChange={title => set({ title })} className={cn('font-semibold tracking-tight', big ? 'text-2xl @3xl:text-3xl' : 'text-lg', tone)} as="h3" />
            <EditableText value={tile.body} multiline onChange={b => set({ body: b })} className={cn('mt-2', big ? 'text-base' : 'text-sm', mutedTone)} as="p" />
          </div>
        </div>
      );
  }

  return body;
}

function BentoView({ section, onChange }: SectionProps<BentoSection>) {
  const editable = useEditMode();
  const thumbnail = useIsThumbnail();
  const linkable = !editable && !thumbnail;
  const setTile = (i: number, tile: BentoTile) => onChange({ ...section, tiles: replaceAt(section.tiles, i, tile) });

  const moveTile = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= section.tiles.length) return;
    const tiles = [...section.tiles];
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    onChange({ ...section, tiles });
  };

  return (
    <section id={section.id} className="py-20 @3xl:py-28">
      <div className={container}>
        <SectionHeading
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          onChange={patch => onChange({ ...section, ...patch })}
        />
        <div className="grid grid-flow-dense auto-rows-[minmax(190px,auto)] grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          {section.tiles.map((tile, i) => {
            const className = cn(
              'group/tile relative overflow-hidden p-6 transition',
              tile.accent ? 'rounded-[var(--site-radius)] bg-[var(--site-accent)]' : card,
              tile.kind === 'link' && linkable && 'hover:-translate-y-0.5 hover:shadow-lg',
              tileSizeClass[tile.size],
            );
            const content = <TileView tile={tile} onChange={t => setTile(i, t)} />;
            // Link tiles, and videos without a playable embed, open their URL
            const opensUrl = tile.kind === 'link' || (tile.kind === 'video' && !isAllowedEmbed(tile.embedUrl) && !!tile.url);
            return opensUrl && linkable ? (
              <a key={tile.id} href={normalizeUrl(tile.url ?? '')} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
              </a>
            ) : (
              <div key={tile.id} className={className}>
                {content}
                <TileControls
                  tile={tile}
                  onChange={t => setTile(i, t)}
                  onRemove={() => onChange({ ...section, tiles: removeAt(section.tiles, i) })}
                  onMove={dir => moveTile(i, dir)}
                />
              </div>
            );
          })}
          <LinkPasteBox sectionId={section.id} onAddBlank={() => onChange({ ...section, tiles: [...section.tiles, newTile('feature')] })} />
        </div>
      </div>
    </section>
  );
}

// ---------- Testimonials ----------

function TestimonialsView({ section, onChange }: SectionProps<TestimonialsSection>) {
  return (
    <section className="py-20 @3xl:py-28">
      <div className={container}>
        <SectionHeading title={section.title} onChange={patch => onChange({ ...section, ...patch })} />
        <div className="grid gap-4 @3xl:grid-cols-3">
          {section.items.map((item, i) => {
            const set = (patch: Partial<typeof item>) => onChange({ ...section, items: replaceAt(section.items, i, { ...item, ...patch }) });
            const initials = item.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
            return (
              <figure key={item.id} className={cn(card, 'group/item relative flex flex-col justify-between gap-6 p-6')}>
                <EditableText as="p" multiline value={item.quote} onChange={quote => set({ quote })} className="text-base leading-relaxed" />
                <figcaption className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--site-accent)] text-sm font-bold text-[var(--site-accent-fg)]">
                    {initials || '?'}
                  </span>
                  <div className="min-w-0">
                    <EditableText as="p" value={item.name} onChange={name => set({ name })} className="text-sm font-semibold" />
                    <EditableText as="p" value={item.role} onChange={role => set({ role })} className="text-sm text-[var(--site-muted)]" />
                  </div>
                </figcaption>
                <RemoveItemButton onClick={() => onChange({ ...section, items: removeAt(section.items, i) })} />
              </figure>
            );
          })}
        </div>
        <AddItemButton label="Add testimonial" className="mt-4 w-full" onClick={() => onChange({ ...section, items: [...section.items, newTestimonial()] })} />
      </div>
    </section>
  );
}

// ---------- Pricing ----------

function PricingView({ section, onChange }: SectionProps<PricingSection>) {
  const editable = useEditMode();
  return (
    <section id={section.id} className="py-20 @3xl:py-28">
      <div className={container}>
        <SectionHeading title={section.title} subtitle={section.subtitle} onChange={patch => onChange({ ...section, ...patch })} />
        <div className="mx-auto grid max-w-5xl items-stretch gap-4 @3xl:grid-cols-3">
          {section.plans.map((plan, i) => {
            const set = (patch: Partial<typeof plan>) => onChange({ ...section, plans: replaceAt(section.plans, i, { ...plan, ...patch }) });
            return (
              <div
                key={plan.id}
                className={cn(
                  'group/item relative flex flex-col p-7',
                  card,
                  plan.highlighted && 'border-2 border-[var(--site-accent)] shadow-xl',
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[var(--site-accent)] px-3 py-0.5 text-xs font-semibold text-[var(--site-accent-fg)]">
                    Most popular
                  </span>
                )}
                <EditableText as="h3" value={plan.name} onChange={name => set({ name })} className="text-lg font-semibold" />
                <EditableText as="p" value={plan.description} onChange={description => set({ description })} className="mt-1 text-sm text-[var(--site-muted)]" />
                <div className="mt-6 flex items-baseline gap-1">
                  <EditableText value={plan.price} onChange={price => set({ price })} className="text-5xl font-extrabold tracking-tight" />
                  <EditableText value={plan.period} placeholder="/mo" onChange={period => set({ period })} className="text-sm text-[var(--site-muted)]" />
                </div>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="group/feature flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-accent)]" />
                      <EditableText
                        value={feature}
                        onChange={v => set({ features: v.trim() ? replaceAt(plan.features, fi, v) : removeAt(plan.features, fi) })}
                        className="flex-1"
                      />
                    </li>
                  ))}
                  {editable && (
                    <li>
                      <button
                        type="button"
                        className="text-xs font-medium text-[var(--site-muted)] hover:text-[var(--site-accent)] cursor-pointer"
                        onClick={() => set({ features: [...plan.features, 'New feature'] })}
                      >
                        + Add feature
                      </button>
                    </li>
                  )}
                </ul>
                <div className="mt-8 flex">
                  <EditableLink
                    link={plan.cta}
                    onChange={cta => set({ cta })}
                    className={cn(plan.highlighted ? primaryButton : secondaryButton, 'w-full')}
                  />
                </div>
                {editable && (
                  <label className="editor-ui mt-4 flex items-center gap-2 text-xs text-[var(--site-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!plan.highlighted}
                      onChange={e => onChange({
                        ...section,
                        plans: section.plans.map((p, pi) => ({ ...p, highlighted: pi === i ? e.target.checked : false })),
                      })}
                    />
                    Highlight this plan
                  </label>
                )}
                <RemoveItemButton onClick={() => onChange({ ...section, plans: removeAt(section.plans, i) })} />
              </div>
            );
          })}
        </div>
        {section.plans.length < 3 && (
          <AddItemButton label="Add plan" className="mx-auto mt-4 w-full max-w-5xl" onClick={() => onChange({ ...section, plans: [...section.plans, newPlan()] })} />
        )}
      </div>
    </section>
  );
}

// ---------- FAQ ----------

function FaqView({ section, onChange }: SectionProps<FaqSection>) {
  const editable = useEditMode();
  const [open, setOpen] = React.useState<string | null>(section.items[0]?.id ?? null);
  return (
    <section id={section.id} className="py-20 @3xl:py-28">
      <div className={cn(container, 'max-w-3xl')}>
        <SectionHeading title={section.title} onChange={patch => onChange({ ...section, ...patch })} />
        <div className="divide-y divide-[var(--site-border)] border-y border-[var(--site-border)]">
          {section.items.map((item, i) => {
            const isOpen = editable || open === item.id;
            const set = (patch: Partial<typeof item>) => onChange({ ...section, items: replaceAt(section.items, i, { ...item, ...patch }) });
            return (
              <div key={item.id} className="group/item relative py-5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 text-left cursor-pointer"
                  onClick={() => !editable && setOpen(isOpen ? null : item.id)}
                >
                  <EditableText value={item.question} onChange={question => set({ question })} className="text-lg font-medium" />
                  {!editable && <ChevronDown className={cn('h-5 w-5 shrink-0 text-[var(--site-muted)] transition-transform', isOpen && 'rotate-180')} />}
                </button>
                {isOpen && (
                  <EditableText as="p" multiline value={item.answer} onChange={answer => set({ answer })} className="mt-3 text-[var(--site-muted)] leading-relaxed" />
                )}
                <RemoveItemButton onClick={() => onChange({ ...section, items: removeAt(section.items, i) })} />
              </div>
            );
          })}
        </div>
        <AddItemButton label="Add question" className="mt-6 w-full" onClick={() => onChange({ ...section, items: [...section.items, newFaq()] })} />
      </div>
    </section>
  );
}

// ---------- CTA ----------

function CtaView({ section, onChange }: SectionProps<CtaSection>) {
  return (
    <section className="py-16 @3xl:py-24">
      <div className={container}>
        <div className="relative overflow-hidden rounded-[var(--site-radius)] bg-[var(--site-accent)] px-6 py-16 text-center text-[var(--site-accent-fg)] @3xl:px-16 @3xl:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 20% 0%, white, transparent 45%), radial-gradient(circle at 90% 100%, white, transparent 40%)' }}
          />
          <EditableText as="h2" value={section.title} onChange={title => onChange({ ...section, title })} className="relative text-3xl font-bold tracking-tight @3xl:text-5xl" />
          <EditableText as="p" value={section.subtitle} onChange={subtitle => onChange({ ...section, subtitle })} className="relative mx-auto mt-4 max-w-xl text-lg opacity-85" />
          <div className="relative mt-8 flex justify-center">
            <EditableLink
              link={section.button}
              onChange={button => onChange({ ...section, button })}
              className="inline-flex items-center justify-center rounded-[var(--site-radius)] bg-[var(--site-accent-fg)] px-6 py-3 text-sm font-semibold text-[var(--site-accent)] shadow-sm transition hover:opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------

function FooterView({ section, onChange }: SectionProps<FooterSection>) {
  return (
    <footer className="border-t border-[var(--site-border)] py-10">
      <div className={cn(container, 'flex flex-col items-center justify-between gap-4 text-sm text-[var(--site-muted)] @3xl:flex-row')}>
        <EditableText value={section.text} onChange={text => onChange({ ...section, text })} />
        <div className="flex flex-wrap items-center gap-6">
          {section.links.map((l, i) => (
            <EditableLink
              key={l.id}
              link={l}
              className="hover:text-[var(--site-fg)] transition-colors"
              onChange={next => onChange({ ...section, links: replaceAt(section.links, i, next) })}
              onRemove={() => onChange({ ...section, links: removeAt(section.links, i) })}
            />
          ))}
          <AddItemButton label="Link" className="border-1 px-2 py-1 text-xs" onClick={() => onChange({ ...section, links: [...section.links, newLink('Link', '#')] })} />
        </div>
      </div>
    </footer>
  );
}

export function SectionView({ section, onChange }: { section: Section; onChange: (section: Section) => void }) {
  switch (section.type) {
    case 'navbar': return <NavbarView section={section} onChange={onChange} />;
    case 'hero': return <HeroView section={section} onChange={onChange} />;
    case 'logos': return <LogosView section={section} onChange={onChange} />;
    case 'bento': return <BentoView section={section} onChange={onChange} />;
    case 'testimonials': return <TestimonialsView section={section} onChange={onChange} />;
    case 'pricing': return <PricingView section={section} onChange={onChange} />;
    case 'faq': return <FaqView section={section} onChange={onChange} />;
    case 'cta': return <CtaView section={section} onChange={onChange} />;
    case 'footer': return <FooterView section={section} onChange={onChange} />;
    default: return null;
  }
}
