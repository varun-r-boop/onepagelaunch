'use client';

import * as React from 'react';
import { Download, Loader2, RefreshCw, Users, X } from 'lucide-react';

export interface WaitlistSignup {
  email: string;
  created_at: string;
}

// Loads the owner's sign-ups. `setupNeeded` means the database table hasn't been created yet.
export function useWaitlist(projectId?: string) {
  const [signups, setSignups] = React.useState<WaitlistSignup[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist?projectId=${encodeURIComponent(projectId)}`);
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Failed to load sign-ups');
      setSignups(result.signups);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sign-ups');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return { signups, loading, error, refresh };
}

function downloadCsv(signups: WaitlistSignup[], name: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [['email', 'joined_at'], ...signups.map(s => [s.email, s.created_at])];
  const blob = new Blob([rows.map(r => r.map(escape).join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'waitlist'}-waitlist.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WaitlistPanel({ data, projectName, hasForm, onClose }: {
  data: ReturnType<typeof useWaitlist>;
  projectName: string;
  hasForm: boolean;
  onClose: () => void;
}) {
  const { signups, loading, error, refresh } = data;
  return (
    <aside className="fixed right-0 top-14 bottom-0 z-40 flex w-full flex-col border-l border-gray-200 bg-white shadow-xl sm:w-80">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">Waitlist</h2>
          <p className="text-xs text-gray-500">{signups ? `${signups.length} ${signups.length === 1 ? 'person' : 'people'} signed up` : 'People who joined from your page'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void refresh()} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Refresh">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </button>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 cursor-pointer" aria-label="Close waitlist panel">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 text-sm">
        {!hasForm && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Your page has no sign-up form. Hover the hero or call-to-action section and click <strong>Waitlist form</strong> to add one.
          </p>
        )}
        {error === 'setup_needed' ? (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            The waitlist database table isn’t set up yet. Run <code>supabase/migrations/20261030000000_waitlist_signups.sql</code> in the Supabase SQL editor.
          </p>
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
        ) : !signups ? (
          <p className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
        ) : signups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-500">
            <Users className="h-8 w-8 text-gray-300" />
            <p>No sign-ups yet.</p>
            <p className="text-xs">Publish your page and share the link. Sign-ups show up here.</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => downloadCsv(signups, projectName)}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download CSV
            </button>
            <ul className="divide-y divide-gray-100">
              {signups.map(s => (
                <li key={s.email} className="flex items-center justify-between gap-2 py-2">
                  <span className="truncate text-gray-900">{s.email}</span>
                  <span className="shrink-0 text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
