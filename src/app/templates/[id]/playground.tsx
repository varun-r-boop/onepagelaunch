'use client';

import Link from 'next/link';
import { createSiteFromTemplate } from '@/lib/site/templates';
import SiteEditor from '@/components/site/SiteEditor';
import { useSiteHistory } from '@/components/site/use-site-history';

// Try the editor without an account. Nothing is saved.
export default function TemplatePlayground({ templateId }: { templateId: string }) {
  const { site, setSite, undo, redo, canUndo, canRedo } = useSiteHistory(
    createSiteFromTemplate(templateId, 'Acme'),
  );

  return (
    <SiteEditor
      site={site}
      onChange={setSite}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      saveStatus="local"
      backHref="/templates"
      openTemplatesOnLoad
      primaryAction={
        <Link href="/#get-started" className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700">
          Publish yours — free
        </Link>
      }
    />
  );
}
