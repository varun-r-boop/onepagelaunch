'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DEBOUNCE_DELAY } from '@/lib/constants';
import { draftOf, sameContent } from '@/lib/site/publish';
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

export function SiteProjectClient({ site, isOwner, projectId, welcome }: SiteProjectClientProps) {
  if (!isOwner) {
    // The server only sends visitors the published version
    return <SiteRenderer site={site} showBadge />;
  }
  return <OwnerEditor initialSite={site} projectId={projectId} welcome={welcome} />;
}

async function saveProject(projectData: SiteData, projectId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectData, editId: projectId }),
    });
    const result = await response.json();
    return !!result.success;
  } catch (error) {
    console.error('Error saving project:', error);
    return false;
  }
}

function OwnerEditor({ initialSite, projectId, welcome }: { initialSite: SiteData; projectId: string; welcome?: boolean }) {
  const { site, setSite, undo, redo, canUndo, canRedo } = useSiteHistory(draftOf(initialSite));
  // Pages from before drafts existed were always live: treat what's there as published
  const [published, setPublished] = useState<SiteData | null>(
    initialSite.publishedSite === undefined ? draftOf(initialSite) : initialSite.publishedSite,
  );
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [publishing, setPublishing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payload = useMemo(() => ({ ...site, publishedSite: published }), [site, published]);
  // For pages from before drafts, this differs from `payload`, so the first auto-save
  // stores their published copy and moves them onto drafts
  const lastSaved = useRef(JSON.stringify({ ...draftOf(initialSite), publishedSite: initialSite.publishedSite ?? null }));

  // Debounced auto-save of the draft (visitors don't see it until Publish)
  useEffect(() => {
    const serialized = JSON.stringify(payload);
    if (serialized === lastSaved.current) return;
    setStatus('unsaved');
    timer.current = setTimeout(async () => {
      setStatus('saving');
      if (await saveProject(payload, projectId)) {
        lastSaved.current = serialized;
        setStatus('saved');
      } else {
        setStatus('error');
      }
    }, DEBOUNCE_DELAY);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [payload, projectId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (status === 'saved') return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  const publishState = useMemo(() => {
    if (!published) return 'never' as const;
    return sameContent(site, published) ? 'live' as const : 'changes' as const;
  }, [site, published]);

  const publish = useCallback(async () => {
    // Save now, replacing any pending draft auto-save
    if (timer.current) clearTimeout(timer.current);
    setPublishing(true);
    const snapshot = draftOf(site);
    const body = { ...site, publishedSite: snapshot };
    const firstTime = !published;
    if (await saveProject(body, projectId)) {
      lastSaved.current = JSON.stringify(body);
      setPublished(snapshot);
      setStatus('saved');
      const url = `${window.location.origin}/${site.slug}`;
      toast.success(firstTime ? '🎉 Your page is live!' : 'Changes published', {
        description: url,
        action: {
          label: 'Copy link',
          onClick: () => { void navigator.clipboard.writeText(url).then(() => toast.success('Link copied')); },
        },
      });
    } else {
      toast.error('Couldn’t publish. Please try again.');
    }
    setPublishing(false);
  }, [site, published, projectId]);

  return (
    <SiteEditor
      site={site}
      onChange={setSite}
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      saveStatus={status}
      projectId={projectId}
      publish={{ state: publishState, busy: publishing, onPublish: () => void publish(), liveUrl: `/${site.slug}?view=1` }}
      openSetupOnLoad={welcome}
    />
  );
}
