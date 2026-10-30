'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlignCenter, AlignLeft, Link2, ArrowDown, ArrowUp, Check, Copy, ExternalLink, Eye, EyeOff, LayoutTemplate,
  Loader2, Mail, Monitor, PanelRightClose, PanelRightOpen, Plus, Redo2, Rocket, Smartphone, Trash2, Undo2, X, MousePointerClick,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { themeBackground } from '@/lib/site/themes';
import { SECTION_CATALOG, cloneWithNewIds, createSection, sectionLabel } from '@/lib/site/sections';
import { hasWaitlist } from '@/lib/site/publish';
import type { CtaSection, HeroSection, Section, SectionType, SiteData, SiteTheme } from '@/lib/site/types';
import SiteRenderer, { SiteFonts, ThemeFrame } from './SiteRenderer';
import { RenderModeContext } from './editable';
import { SectionView } from './sections';
import QuickStartWizard from './QuickStartWizard';
import DesignPanel from './design-panel';
import WaitlistPanel, { useWaitlist } from './waitlist-panel';
import { SiteActionsContext, type SiteActions } from './link-paste-box';
import { resolveLinks } from '@/lib/links/client';
import { extractUrls } from '@/lib/links/detect';
import { LINKS_SECTION_ID, applyLinksToSite } from '@/lib/links/apply';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'local';

interface SiteEditorProps {
  site: SiteData;
  onChange: (site: SiteData | ((prev: SiteData) => SiteData)) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: SaveStatus;
  // Draft/live state for saved pages. Without it (the playground), `primaryAction` is shown instead.
  publish?: PublishControls;
  // Enables the waitlist panel for saved pages
  projectId?: string;
  backHref?: string;
  // Rendered at the right end of the toolbar, e.g. a "Publish" button in the playground
  primaryAction?: React.ReactNode;
  openSetupOnLoad?: boolean;
}

export interface PublishControls {
  // never = not live yet; changes = live, with unpublished edits; live = up to date
  state: 'never' | 'changes' | 'live';
  busy: boolean;
  onPublish: () => void;
  liveUrl: string;
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
            <div className="border-b border-gray-100" style={{ background: themeBackground(theme) }}>
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
            {!section.waitlist && <button
              type="button"
              className={cn(btn, 'w-auto px-2 text-xs font-medium')}
              title="Show or hide the second button"
              onClick={() => onPatch({ ...section, showSecondary: !section.showSecondary } as HeroSection)}
            >
              <MousePointerClick className="mr-1 h-3.5 w-3.5" /> {section.showSecondary ? '1 button' : '2 buttons'}
            </button>}
          </>
        )}
        {(section.type === 'hero' || section.type === 'cta') && (
          <button
            type="button"
            className={cn(btn, 'w-auto px-2 text-xs font-medium', section.waitlist && 'bg-gray-900 text-white hover:bg-gray-800 hover:text-white')}
            title={section.waitlist ? 'Use a button instead' : 'Collect emails with a waitlist form'}
            aria-pressed={!!section.waitlist}
            onClick={() => onPatch({ ...section, waitlist: !section.waitlist } as HeroSection | CtaSection)}
          >
            <Mail className="mr-1 h-3.5 w-3.5" /> Waitlist form
          </button>
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
  site, onChange, onUndo, onRedo, canUndo, canRedo, saveStatus, publish, projectId, backHref = '/dashboard', primaryAction, openSetupOnLoad,
}: SiteEditorProps) {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [preview, setPreview] = React.useState(false);
  // The sidebar holds the editing tools; it can be hidden for more canvas room
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [tab, setTab] = React.useState<'design' | 'waitlist'>('design');
  // On small screens the sidebar covers the page, so start with it hidden
  React.useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) setSidebarOpen(false);
  }, []);
  const [insertAt, setInsertAt] = React.useState<number | null>(null);
  const [wizard, setWizard] = React.useState(!!openSetupOnLoad);
  const removedSections = React.useRef(new Map<SectionType, Section>());
  const waitlist = useWaitlist(projectId);
  const pageHasWaitlist = hasWaitlist(site);

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

  const wizardInfo = React.useMemo(
    () => ({ name: brand === 'Acme' ? '' : brand, headline: '', description: '', goal: 'link' as const, link: '' }),
    // Only recompute when the wizard opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wizard],
  );

  const startOver = () => {
    if (!window.confirm('Start over? Your page will be rebuilt from new answers. You can undo with Ctrl/Cmd+Z.')) return;
    setWizard(true);
  };

  const editing = !preview;

  // Pasted links become tiles; social profiles are also added to the footer
  const addLinks = React.useCallback<SiteActions['addLinks']>(async (text, sectionId) => {
    const previews = await resolveLinks(text);
    if (previews.length === 0) return;
    let added = { tiles: 0, socials: 0 };
    onChange(prev => {
      const result = applyLinksToSite(prev, previews, sectionId);
      added = result;
      return result.site;
    });
    const tiles = `Added ${added.tiles} ${added.tiles === 1 ? 'tile' : 'tiles'}`;
    toast.success(added.socials ? `${tiles} and ${added.socials} footer ${added.socials === 1 ? 'link' : 'links'}` : tiles);
    if (!sectionId) {
      setTimeout(() => document.getElementById(LINKS_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [onChange]);
  const siteActions = React.useMemo(() => ({ addLinks }), [addLinks]);

  // Pasting links anywhere on the page (outside a text field) adds them too
  React.useEffect(() => {
    if (!editing || wizard || insertAt !== null) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (extractUrls(text).length === 0) return;
      e.preventDefault();
      toast.loading('Adding your links…', { id: 'paste-links' });
      void addLinks(text).finally(() => toast.dismiss('paste-links'));
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [editing, wizard, insertAt, addLinks]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar: just the page, its save state and Publish. Tools live in the sidebar. */}
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

        <div className="flex items-center gap-1">
          <ToolbarButton
            active={sidebarOpen}
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Hide editing panel' : 'Show editing panel'}
            aria-label={sidebarOpen ? 'Hide editing panel' : 'Show editing panel'}
            className="px-2"
          >
            {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </ToolbarButton>
          {publish && (
            publish.state === 'live' ? (
              <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-green-50 px-3 text-sm font-semibold text-green-700" title="Visitors see the latest version">
                <Check className="h-4 w-4" /> Live
              </span>
            ) : (
              <button
                type="button"
                onClick={publish.onPublish}
                disabled={publish.busy}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
              >
                {publish.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {publish.state === 'never' ? 'Publish' : 'Publish changes'}
              </button>
            )
          )}
          {primaryAction}
        </div>
      </div>

      {/* Canvas */}
      <div className={cn('pt-14 transition-[padding]', sidebarOpen && 'lg:pr-80')}>
        <div className={cn('mx-auto py-6', device === 'mobile' ? 'w-[390px]' : 'w-full px-3 sm:px-6')}>
          {editing && site.sections.length > 0 && (
            <p className="mb-3 text-center text-xs text-gray-500">
              Click any text to edit it · Paste a link anywhere to add it as a tile · Hover a section or tile for more options
            </p>
          )}
          <div className={cn('overflow-hidden bg-white shadow-sm ring-1 ring-gray-200', device === 'mobile' ? 'rounded-[28px]' : 'rounded-xl')}>
            {site.sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-32 text-center">
                <p className="text-lg font-semibold text-gray-900">Your page is empty</p>
                <div className="flex gap-2">
                  <ToolbarButton active onClick={() => setInsertAt(0)}><Plus className="h-4 w-4" /> Add a section</ToolbarButton>
                  <ToolbarButton onClick={() => setWizard(true)}><LayoutTemplate className="h-4 w-4" /> Set up with a few answers</ToolbarButton>
                </div>
              </div>
            ) : (
              <SiteActionsContext.Provider value={siteActions}>
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
              </SiteActionsContext.Provider>
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
      {sidebarOpen && (
        <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-full flex-col border-l border-gray-200 bg-white shadow-xl sm:w-80 lg:shadow-none" aria-label="Editing panel">
          {/* Tools */}
          <div className="space-y-2 border-b border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <ToolbarButton active={preview} onClick={() => setPreview(p => !p)} className="flex-1 justify-center ring-1 ring-gray-200" title="See the page as visitors will">
                {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {preview ? 'Exit preview' : 'Preview'}
              </ToolbarButton>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="Preview size">
                <button type="button" title="Desktop" aria-label="Desktop" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} className={cn('rounded-md p-1.5 cursor-pointer', device === 'desktop' ? 'bg-white shadow-sm' : 'text-gray-500')}>
                  <Monitor className="h-4 w-4" />
                </button>
                <button type="button" title="Mobile" aria-label="Mobile" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} className={cn('rounded-md p-1.5 cursor-pointer', device === 'mobile' ? 'bg-white shadow-sm' : 'text-gray-500')}>
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ToolbarButton title="Undo (Ctrl/Cmd+Z)" aria-label="Undo" disabled={!canUndo} onClick={onUndo} className="px-2">
                <Undo2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton title="Redo" aria-label="Redo" disabled={!canRedo} onClick={onRedo} className="px-2">
                <Redo2 className="h-4 w-4" />
              </ToolbarButton>
              <span className="flex-1" />
              {publish && publish.state !== 'never' && site.slug && (
                <ToolbarButton
                  title="Copy your page link"
                  className="px-2 text-xs"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}/${site.slug}`);
                      toast.success('Link copied. Share it anywhere!');
                    } catch {
                      toast.error('Couldn’t copy the link');
                    }
                  }}
                >
                  <Link2 className="h-4 w-4" /> Copy link
                </ToolbarButton>
              )}
              {publish && publish.state !== 'never' && (
                <a href={publish.liveUrl} target="_blank" rel="noopener noreferrer" title="Open your live page" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
                  <ExternalLink className="h-4 w-4" /> View live
                </a>
              )}
            </div>
          </div>

          {/* Tabs */}
          {projectId && (pageHasWaitlist || !!waitlist.signups?.length) && (
            <div className="flex gap-1 border-b border-gray-100 px-3 py-2" role="tablist">
              {(['design', 'waitlist'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn('inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium cursor-pointer', tab === t ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100')}
                >
                  {t === 'design' ? 'Design' : 'Waitlist'}
                  {t === 'waitlist' && !!waitlist.signups?.length && (
                    <span className={cn('rounded-full px-1.5 text-xs font-semibold', tab === t ? 'bg-white text-gray-900' : 'bg-gray-900 text-white')}>{waitlist.signups.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {tab === 'waitlist' && projectId ? (
              <WaitlistPanel data={waitlist} projectName={site.projectName} hasForm={pageHasWaitlist} />
            ) : (
              <DesignPanel site={site} onChange={onChange} onStartOver={startOver} removed={removedSections} />
            )}
          </div>
        </aside>
      )}
      {insertAt !== null && <AddSectionDialog theme={site.theme} brand={brand} onPick={insertSection} onClose={() => setInsertAt(null)} />}
      {wizard && (
        <QuickStartWizard
          initialInfo={wizardInfo}
          templateId={site.template ?? 'launch'}
          base={{ projectName: site.projectName, slug: site.slug }}
          onFinish={next => {
            // Content is rebuilt from the answers; the colors and font the user picked stay
            onChange(prev => ({ ...prev, projectName: next.projectName, template: next.template, sections: next.sections }));
            removedSections.current.clear();
            setWizard(false);
            // Straight into editing, with colors and sections at hand
            setSidebarOpen(true);
            setTab('design');
          }}
          onClose={() => setWizard(false)}
        />
      )}
    </div>
  );
}
