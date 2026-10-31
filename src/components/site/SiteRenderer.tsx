'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { googleFontsHref, themeToCssVars } from '@/lib/site/themes';
import type { Section, SiteData, SiteTheme } from '@/lib/site/types';
import { RenderModeContext, SiteSlugContext, type RenderMode } from './editable';
import { SectionView } from './sections';

export function SiteFonts() {
  // React hoists stylesheet links into <head>
  return <link rel="stylesheet" href={googleFontsHref()} precedence="default" />;
}

// Applies the theme's CSS variables. Uses a size container so layouts respond
// to the frame width (which lets the editor show a true mobile preview).
export function ThemeFrame({ theme, className, children }: { theme: SiteTheme; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('site-root @container', className)} data-font={theme.font} style={themeToCssVars(theme)}>
      {children}
    </div>
  );
}

interface SiteRendererProps {
  site: SiteData;
  editable?: boolean;
  // Renders links as plain text so the site can sit inside a clickable card
  thumbnail?: boolean;
  onSectionChange?: (index: number, section: Section) => void;
  wrapSection?: (section: Section, index: number, node: React.ReactNode) => React.ReactNode;
  showBadge?: boolean;
  className?: string;
}

export default function SiteRenderer({ site, editable = false, thumbnail = false, onSectionChange, wrapSection, showBadge = false, className }: SiteRendererProps) {
  const mode: RenderMode = editable ? 'edit' : thumbnail ? 'thumbnail' : 'view';
  return (
    <RenderModeContext.Provider value={mode}>
      <SiteSlugContext.Provider value={site.slug}>
      <SiteFonts />
      <ThemeFrame theme={site.theme} className={cn('min-h-full', className)}>
        {site.sections.map((section, index) => {
          const node = <SectionView section={section} onChange={next => onSectionChange?.(index, next)} />;
          return (
            <React.Fragment key={section.id}>
              {wrapSection ? wrapSection(section, index, node) : node}
            </React.Fragment>
          );
        })}
        {showBadge && !thumbnail && (
          <Link
            href="/"
            className="fixed bottom-4 left-4 z-40 rounded-full border border-[var(--site-border)] bg-[var(--site-card)] px-3 py-1.5 text-xs font-medium text-[var(--site-muted)] shadow-sm transition hover:text-[var(--site-fg)]"
          >
            Made with 🧱 OnePageLaunch
          </Link>
        )}
      </ThemeFrame>
      </SiteSlugContext.Provider>
    </RenderModeContext.Provider>
  );
}
