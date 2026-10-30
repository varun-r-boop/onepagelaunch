'use client';

import { useMemo } from 'react';
import { THEME_PRESETS } from '@/lib/site/themes';
import { createSiteFromTemplate } from '@/lib/site/templates';
import SiteRenderer from '@/components/site/SiteRenderer';

// Live render of a template, scaled down to card size
export default function TemplateThumbnail({ templateId }: { templateId: string }) {
  const site = useMemo(() => createSiteFromTemplate(templateId, 'Acme'), [templateId]);
  return (
    <div className="pointer-events-none relative h-72 overflow-hidden" style={{ background: THEME_PRESETS[site.theme.preset].bg }} aria-hidden>
      <div style={{ width: 1280, transform: 'scale(0.28)', transformOrigin: 'top left' }}>
        <SiteRenderer site={site} thumbnail />
      </div>
    </div>
  );
}
