'use client';

import { useEffect, useRef, useState } from 'react';
import { DEBOUNCE_DELAY } from '@/lib/constants';
import type { SiteData } from '@/lib/site/types';
import SiteEditor, { type SaveStatus } from './SiteEditor';
import SiteRenderer from './SiteRenderer';
import { useSiteHistory } from './use-site-history';

interface SiteProjectClientProps {
  site: SiteData;
  isOwner: boolean;
  projectId: string;
  welcome?: boolean;
}

export function SiteProjectClient({ site: initialSite, isOwner, projectId, welcome }: SiteProjectClientProps) {
  if (!isOwner) {
    return <SiteRenderer site={initialSite} showBadge />;
  }
  return <OwnerEditor initialSite={initialSite} projectId={projectId} welcome={welcome} />;
}

function OwnerEditor({ initialSite, projectId, welcome }: { initialSite: SiteData; projectId: string; welcome?: boolean }) {
  const { site, setSite, undo, redo, canUndo, canRedo } = useSiteHistory(initialSite);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const lastSaved = useRef(JSON.stringify(initialSite));

  // Debounced auto-save
  useEffect(() => {
    const serialized = JSON.stringify(site);
    if (serialized === lastSaved.current) return;
    setStatus('unsaved');
    const timer = setTimeout(async () => {
      setStatus('saving');
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectData: site, editId: projectId }),
        });
        const result = await response.json();
        if (result.success) {
          lastSaved.current = serialized;
          setStatus('saved');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error saving project:', error);
        setStatus('error');
      }
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [site, projectId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (status === 'saved') return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  return (
    <SiteEditor
      site={site}
      onChange={setSite}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      saveStatus={status}
      liveUrl={`/${site.slug}?view=1`}
      openTemplatesOnLoad={welcome}
    />
  );
}
