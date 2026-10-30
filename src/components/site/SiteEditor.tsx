'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlignCenter, AlignLeft, ArrowDown, ArrowUp, Check, Copy, ExternalLink, Eye, EyeOff, LayoutTemplate,
  Monitor, Paintbrush, Plus, Redo2, Smartphone, Trash2, Undo2, X, MousePointerClick,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_SWATCHES, THEME_FONTS, THEME_PRESETS, THEME_RADII, readableOn } from '@/lib/site/themes';
import { SECTION_CATALOG, cloneWithNewIds, createSection, sectionLabel } from '@/lib/site/sections';
import { SITE_TEMPLATES, createSiteFromTemplate } from '@/lib/site/templates';
import type { HeroSection, Section, SectionType, SiteData, SiteTheme, ThemeFont, ThemePreset, ThemeRadius } from '@/lib/site/types';
import SiteRenderer, { SiteFonts, ThemeFrame } from './SiteRenderer';
import { RenderModeContext } from './editable';
import { SectionView } from './sections';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'local';

interface SiteEditorProps {
  site: SiteData;
  onChange: (site: SiteData | ((prev: SiteData) => SiteData)) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  liveUrl?: string;
  backHref?: string;
  // Rendered at the right end of the toolbar, e.g. a "Sign up to publish" button
  primaryAction?: React.ReactNode;
  openTemplatesOnLoad?: boolean;
}

// ---------- Small building blocks ----------

function ToolbarButton({ active, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default',
        active && 'bg-gray-900 text-white hover:bg-gray-800',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className={cn('flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl', wide ? 'max-w-5xl' : 'max-w-3xl')}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// Renders real site content at a small scale, used for thumbnails
function ScaledPreview({ theme, sections, height, scale }: { theme: SiteTheme; sections: Section[]; height: number; scale: number }) {
  const width = 1280;
  return (
    <div className="pointer-events-none relative w-full overflow-hidden" style={{ height }} aria-hidden>
      <div style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <RenderModeContext.Provider value="thumbnail">
          <ThemeFrame theme={theme}>
            {sections.map(s => <SectionView key={s.id} section={s} onChange={() => {}} />)}
          </ThemeFrame>
        </RenderModeContext.Provider>
      </div>
    </div>
  );
}

// ---------- Dialogs ----------

// A clickable card. Not a <button>, since previews inside it contain buttons.
function PickCard({ onPick, className, children }: { onPick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick())}
      className={cn('cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500', className)}
    >
      {children}
    </div>
  );
}

function AddSectionDialog({ theme, brand, onPick, onClose }: { theme: SiteTheme; brand: string; onPick: (type: SectionType) => void; onClose: () => void }) {
  const previews = React.useMemo(
    () => Object.fromEntries(SECTION_CATALOG.map(c => [c.type, createSection(c.type, brand)])),
    [brand],
  );
  return (
    <Modal title="Add a section" subtitle="Pick a pre-designed section. You can edit everything after." onClose={onClose} wide>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_CATALOG.map(item => (
          <PickCard
            key={item.type}
            onPick={() => onPick(item.type)}
            className="group overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-gray-900 hover:shadow-lg"
          >
            <div className="border-b border-gray-100" style={{ background: THEME_PRESETS[theme.preset].bg }}>
              <ScaledPreview theme={theme} sections={[previews[item.type]]} height={150} scale={0.24} />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          </PickCard>
        ))}
      </div>
    </Modal>
  );
}

function TemplatesDialog({ brand, currentTemplate, onPick, onClose, welcome }: {
  brand: string;
  currentTemplate?: string;
  onPick: (id: string) => void;
  onClose: () => void;
  welcome?: boolean;
}) {
  const sites = React.useMemo(() => SITE_TEMPLATES.map(t => createSiteFromTemplate(t.id, brand)), [brand]);
  return (
    <Modal
      title={welcome ? 'Pick a starting point' : 'Templates'}
      subtitle={welcome ? 'Choose a look. You can change the text, colors and sections anytime.' : 'Switching templates replaces the content on your page.'}
      onClose={onClose}
      wide
    >
      <div className="grid gap-5 md:grid-cols-3">
        {SITE_TEMPLATES.map((template, i) => (
          <PickCard
            key={template.id}
            onPick={() => onPick(template.id)}
            className={cn(
              'group overflow-hidden rounded-xl border-2 text-left transition hover:shadow-xl',
              currentTemplate === template.id ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400',
            )}
          >
            <div style={{ background: THEME_PRESETS[template.theme.preset].bg }}>
              <ScaledPreview theme={template.theme} sections={sites[i].sections} height={260} scale={0.235} />
            </div>
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{template.name}</p>
                {currentTemplate === template.id && <span className="text-xs font-medium text-gray-500">Current</span>}
              </div>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            </div>
          </PickCard>
        ))}
      </div>
    </Modal>
  );
}

function DesignPanel({ theme, onChange, onClose }: { theme: SiteTheme; onChange: (theme: SiteTheme) => void; onClose: () => void }) {
  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 w-80 overflow-y-auto border-l border-gray-200 bg-white p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Design</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close design panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Theme</h3>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {(Object.keys(THEME_PRESETS) as ThemePreset[]).map(key => {
          const p = THEME_PRESETS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...theme, preset: key, accent: p.defaultAccent })}
              className={cn('overflow-hidden rounded-lg border-2 text-left cursor-pointer', theme.preset === key ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
            >
              <div className="flex h-12 items-end gap-1 p-2" style={{ background: p.bg }}>
                <span className="h-5 w-3 rounded-sm" style={{ background: p.card, border: `1px solid ${p.border}` }} />
                <span className="h-3 w-6 rounded-sm" style={{ background: p.fg }} />
                <span className="h-3 w-3 rounded-full" style={{ background: p.defaultAccent }} />
              </div>
              <p className="px-2 py-1 text-xs font-medium text-gray-700">{p.label}</p>
            </button>
          );
        })}
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Accent color</h3>
      <div className="mb-6 flex flex-wrap gap-2">
        {ACCENT_SWATCHES.map(color => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onChange({ ...theme, accent: color })}
            className={cn('flex h-8 w-8 items-center justify-center rounded-full border border-black/10 cursor-pointer', theme.accent === color && 'ring-2 ring-gray-900 ring-offset-2')}
            style={{ background: color }}
          >
            {theme.accent === color && <Check className="h-4 w-4" style={{ color: readableOn(color) }} />}
          </button>
        ))}
        <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-400 text-gray-500" title="Custom color">
          <Plus className="h-4 w-4" />
          <input
            type="color"
            value={theme.accent}
            onChange={e => onChange({ ...theme, accent: e.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Font</h3>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {(Object.keys(THEME_FONTS) as ThemeFont[]).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ ...theme, font: key })}
            className={cn('rounded-lg border-2 px-3 py-2 text-left cursor-pointer', theme.font === key ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
          >
            <span className="block text-xl text-gray-900" style={{ fontFamily: THEME_FONTS[key].family }}>Aa</span>
            <span className="text-xs text-gray-500">{THEME_FONTS[key].label}</span>
          </button>
        ))}
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Corners</h3>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(THEME_RADII) as ThemeRadius[]).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ ...theme, radius: key })}
            className={cn('flex flex-col items-center gap-2 rounded-lg border-2 py-3 cursor-pointer', theme.radius === key ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400')}
          >
            <span className="h-6 w-10 border-2 border-gray-700" style={{ borderRadius: THEME_RADII[key].value === '28px' ? '12px' : THEME_RADII[key].value === '14px' ? '6px' : '1px' }} />
            <span className="text-xs text-gray-600">{THEME_RADII[key].label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

// ---------- Section chrome ----------

function SectionChrome({ section, index, total, children, onMove, onDuplicate, onDelete, onInsert, onPatch }: {
  section: Section;
  index: number;
  total: number;
  children: React.ReactNode;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsert: (at: number) => void;
  onPatch: (section: Section) => void;
}) {
  const btn = 'flex h-7 w-7 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 cursor-pointer disabled:cursor-default';
  return (
    <div className="group/section relative">
      <div className="pointer-events-none absolute inset-0 z-20 ring-2 ring-inset ring-transparent transition group-hover/section:ring-indigo-400/70" />
      <div
        className={cn(
          'editor-ui absolute right-3 z-40 hidden items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 text-gray-900 shadow-lg group-hover/section:flex',
          // Keep the toolbar off the navbar/footer content so their buttons stay clickable
          section.type === 'navbar' ? 'top-full mt-1' : section.type === 'footer' ? 'bottom-full mb-1' : 'top-3',
        )}
        style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
      >
        <span className="px-2 text-xs font-semibold text-gray-500">{sectionLabel(section.type)}</span>
        {section.type === 'hero' && (
          <>
            <button
              type="button"
              className={btn}
              title={section.align === 'center' ? 'Align left' : 'Align center'}
              onClick={() => onPatch({ ...section, align: section.align === 'center' ? 'left' : 'center' } as HeroSection)}
            >
              {section.align === 'center' ? <AlignLeft className="h-4 w-4" /> : <AlignCenter className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className={cn(btn, 'w-auto px-2 text-xs font-medium')}
              title="Show or hide the second button"
              onClick={() => onPatch({ ...section, showSecondary: !section.showSecondary } as HeroSection)}
            >
              <MousePointerClick className="mr-1 h-3.5 w-3.5" /> {section.showSecondary ? '1 button' : '2 buttons'}
            </button>
          </>
        )}
        <span className="mx-0.5 h-5 w-px bg-gray-200" />
        <button type="button" className={btn} title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
          <ArrowDown className="h-4 w-4" />
        </button>
        <button type="button" className={btn} title="Duplicate" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </button>
        <button type="button" className={cn(btn, 'hover:text-red-600')} title="Delete section" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {children}
      {/* Insert-between control */}
      <div className="editor-ui pointer-events-none absolute inset-x-0 -bottom-4 z-40 flex justify-center opacity-0 transition group-hover/section:pointer-events-auto group-hover/section:opacity-100">
        <button
          type="button"
          onClick={() => onInsert(index + 1)}
          className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-700 cursor-pointer"
          style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
        >
          <Plus className="h-3.5 w-3.5" /> Add section
        </button>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  error: 'Couldn’t save',
  local: 'Not saved · demo',
};

// ---------- Editor ----------

export default function SiteEditor({
  site, onChange, onUndo, onRedo, canUndo, canRedo, saveStatus, liveUrl, backHref = '/dashboard', primaryAction, openTemplatesOnLoad,
}: SiteEditorProps) {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [preview, setPreview] = React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);
  const [insertAt, setInsertAt] = React.useState<number | null>(null);
  const [templatesOpen, setTemplatesOpen] = React.useState(!!openTemplatesOnLoad);
  const [welcome, setWelcome] = React.useState(!!openTemplatesOnLoad);

  const brand = (site.sections.find(s => s.type === 'navbar') as { logo?: string } | undefined)?.logo
    || site.projectName.replace(/'s Page$/i, '');

  const setSections = (fn: (sections: Section[]) => Section[]) => onChange(prev => ({ ...prev, sections: fn(prev.sections) }));

  const moveSection = (index: number, dir: -1 | 1) => setSections(sections => {
    const j = index + dir;
    if (j < 0 || j >= sections.length) return sections;
    const next = [...sections];
    [next[index], next[j]] = [next[j], next[index]];
    return next;
  });

  const insertSection = (type: SectionType) => {
    const at = insertAt ?? site.sections.length;
    setSections(sections => [...sections.slice(0, at), createSection(type, brand), ...sections.slice(at)]);
    setInsertAt(null);
  };

  const applyTemplate = (id: string) => {
    if (!welcome && site.sections.length > 0 && !window.confirm('Replace your current page with this template? You can undo with Ctrl/Cmd+Z.')) return;
    const fresh = createSiteFromTemplate(id, site.projectName, site.slug);
    onChange(prev => ({ ...prev, template: fresh.template, theme: fresh.theme, sections: fresh.sections }));
    setTemplatesOpen(false);
    setWelcome(false);
  };

  const editing = !preview;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={backHref} className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
            <span className="text-lg">🧱</span>
            <span className="hidden max-w-[180px] truncate sm:inline">{site.projectName}</span>
          </Link>
          <span className={cn('hidden text-xs md:inline', saveStatus === 'error' ? 'text-red-600' : 'text-gray-400')}>
            {STATUS_LABEL[saveStatus]}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          <button type="button" title="Desktop" onClick={() => setDevice('desktop')} className={cn('rounded-md p-1.5 cursor-pointer', device === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500')}>
            <Monitor className="h-4 w-4" />
          </button>
          <button type="button" title="Mobile" onClick={() => setDevice('mobile')} className={cn('rounded-md p-1.5 cursor-pointer', device === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500')}>
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo} onClick={onUndo} className="px-2">
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo" disabled={!canRedo} onClick={onRedo} className="hidden px-2 sm:inline-flex">
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setTemplatesOpen(true)} title="Templates">
            <LayoutTemplate className="h-4 w-4" /> <span className="hidden lg:inline">Templates</span>
          </ToolbarButton>
          <ToolbarButton active={designOpen} onClick={() => setDesignOpen(o => !o)} title="Colors and fonts">
            <Paintbrush className="h-4 w-4" /> <span className="hidden lg:inline">Design</span>
          </ToolbarButton>
          <ToolbarButton active={preview} onClick={() => setPreview(p => !p)} title="Preview">
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} <span className="hidden lg:inline">{preview ? 'Exit preview' : 'Preview'}</span>
          </ToolbarButton>
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-3 text-sm font-medium text-white hover:bg-gray-800">
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View live</span>
            </a>
          )}
          {primaryAction}
        </div>
      </div>

      {/* Canvas */}
      <div className={cn('pt-14 transition-[padding]', designOpen && 'lg:pr-80')}>
        <div className={cn('mx-auto py-6', device === 'mobile' ? 'w-[390px]' : 'w-full px-3 sm:px-6')}>
          {editing && site.sections.length > 0 && (
            <p className="mb-3 text-center text-xs text-gray-500">
              Click any text to edit it · Click buttons to change links · Hover a section or tile for more options
            </p>
          )}
          <div className={cn('overflow-hidden bg-white shadow-sm ring-1 ring-gray-200', device === 'mobile' ? 'rounded-[28px]' : 'rounded-xl')}>
            {site.sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-32 text-center">
                <p className="text-lg font-semibold text-gray-900">Your page is empty</p>
                <div className="flex gap-2">
                  <ToolbarButton active onClick={() => setInsertAt(0)}><Plus className="h-4 w-4" /> Add a section</ToolbarButton>
                  <ToolbarButton onClick={() => setTemplatesOpen(true)}><LayoutTemplate className="h-4 w-4" /> Use a template</ToolbarButton>
                </div>
              </div>
            ) : (
              <SiteRenderer
                site={site}
                editable={editing}
                onSectionChange={(index, section) => setSections(sections => sections.map((s, i) => (i === index ? section : s)))}
                wrapSection={editing ? (section, index, node) => (
                  <SectionChrome
                    section={section}
                    index={index}
                    total={site.sections.length}
                    onMove={dir => moveSection(index, dir)}
                    onDuplicate={() => setSections(sections => [...sections.slice(0, index + 1), cloneWithNewIds(section), ...sections.slice(index + 1)])}
                    onDelete={() => setSections(sections => sections.filter((_, i) => i !== index))}
                    onInsert={setInsertAt}
                    onPatch={next => setSections(sections => sections.map((s, i) => (i === index ? next : s)))}
                  >
                    {node}
                  </SectionChrome>
                ) : undefined}
              />
            )}
          </div>
          {editing && site.sections.length > 0 && (
            <div className="mt-6 flex justify-center">
              <ToolbarButton className="bg-white shadow-sm ring-1 ring-gray-200" onClick={() => setInsertAt(site.sections.length)}>
                <Plus className="h-4 w-4" /> Add section
              </ToolbarButton>
            </div>
          )}
        </div>
      </div>

      <SiteFonts />
      {designOpen && <DesignPanel theme={site.theme} onChange={theme => onChange(prev => ({ ...prev, theme }))} onClose={() => setDesignOpen(false)} />}
      {insertAt !== null && <AddSectionDialog theme={site.theme} brand={brand} onPick={insertSection} onClose={() => setInsertAt(null)} />}
      {templatesOpen && (
        <TemplatesDialog
          brand={brand}
          welcome={welcome}
          currentTemplate={welcome ? undefined : site.template}
          onPick={applyTemplate}
          onClose={() => { setTemplatesOpen(false); setWelcome(false); }}
        />
      )}
    </div>
  );
}
