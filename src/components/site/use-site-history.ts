'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteData } from '@/lib/site/types';

const MAX_HISTORY = 100;

// Site state with undo/redo. Cmd/Ctrl+Z is ignored while typing in a field so
// the browser's own text undo keeps working there.
export function useSiteHistory(initial: SiteData) {
  const [site, setSiteState] = useState(initial);
  const current = useRef(initial);
  const past = useRef<SiteData[]>([]);
  const future = useRef<SiteData[]>([]);

  const commit = useCallback((value: SiteData) => {
    current.current = value;
    setSiteState(value);
  }, []);

  const setSite = useCallback((next: SiteData | ((prev: SiteData) => SiteData)) => {
    const prev = current.current;
    const value = typeof next === 'function' ? next(prev) : next;
    if (value === prev) return;
    past.current = [...past.current, prev].slice(-MAX_HISTORY);
    future.current = [];
    commit(value);
  }, [commit]);

  const undo = useCallback(() => {
    const previous = past.current[past.current.length - 1];
    if (!previous) return;
    past.current = past.current.slice(0, -1);
    future.current = [current.current, ...future.current];
    commit(previous);
  }, [commit]);

  const redo = useCallback(() => {
    const [next, ...rest] = future.current;
    if (!next) return;
    future.current = rest;
    past.current = [...past.current, current.current];
    commit(next);
  }, [commit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return {
    site,
    setSite,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
