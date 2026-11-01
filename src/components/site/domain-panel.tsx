'use client';

import * as React from 'react';
import { Check, Copy, ExternalLink, Globe, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ProLock, type PlanState } from '@/components/billing';
import type { DnsRecord } from '@/lib/vercel-domains';

interface DomainState {
  domain: string | null;
  status?: 'active' | 'pending';
  records?: DnsRecord[];
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      title="Copy"
      aria-label={`Copy ${value}`}
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="ml-1 inline-flex rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function DomainPanel({ projectId, plan }: { projectId: string; plan: PlanState }) {
  const [state, setState] = React.useState<DomainState | null>(null);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDomain = React.useCallback(async (): Promise<DomainState> => {
    const res = await fetch(`/api/domains?projectId=${encodeURIComponent(projectId)}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Couldn’t load your domain');
    return body;
  }, [projectId]);

  // "Check again"
  const load = async () => {
    setBusy(true);
    try {
      setState(await fetchDomain());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t load your domain');
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    if (plan.loading || plan.plan !== 'pro') return;
    let cancelled = false;
    fetchDomain()
      .then(body => { if (!cancelled) { setState(body); setError(null); } })
      .catch(err => { if (!cancelled) { setState({ domain: null }); setError(err instanceof Error ? err.message : 'Couldn’t load your domain'); } });
    return () => { cancelled = true; };
  }, [plan.loading, plan.plan, fetchDomain]);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain: input }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Couldn’t connect the domain');
      setState(body);
      setInput('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t connect the domain');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm(`Disconnect ${state?.domain}? Your page stays available at its OnePageLaunch address.`)) return;
    setBusy(true);
    await fetch(`/api/domains?projectId=${encodeURIComponent(projectId)}`, { method: 'DELETE' }).catch(() => {});
    setState({ domain: null });
    setBusy(false);
    toast.success('Domain disconnected');
  };

  if (plan.loading) {
    return <p className="flex items-center gap-2 p-5 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  }
  if (plan.plan !== 'pro') {
    return (
      <div className="p-5">
        <ProLock title="Custom domains are a Pro feature" description="Put your page on your own domain, like yourproduct.com." />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5 text-sm">
      <p className="flex items-center gap-1.5 font-semibold text-gray-900"><Globe className="h-4 w-4" /> Custom domain</p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      {!state ? (
        <p className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : !state.domain ? (
        <form onSubmit={connect} className="space-y-2">
          <p className="text-xs text-gray-500">Use a domain you own. Subdomains like www.yourproduct.com or launch.yourproduct.com work too.</p>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="yourproduct.com"
            aria-label="Your domain"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
          />
          <button type="submit" disabled={busy || !input.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-40 cursor-pointer">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Connect domain
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <div className="min-w-0">
              <a href={`https://${state.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate font-medium text-gray-900 hover:underline">
                {state.domain} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
              <span className={state.status === 'active' ? 'text-xs font-medium text-green-700' : 'text-xs font-medium text-amber-700'}>
                {state.status === 'active' ? '● Connected' : '● Waiting for DNS'}
              </span>
            </div>
            <button type="button" onClick={() => void load()} disabled={busy} title="Check again" aria-label="Check DNS again" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer">
              <RefreshCw className={busy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </button>
          </div>

          {state.status !== 'active' && state.records && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Add {state.records.length === 1 ? 'this record' : 'these records'} at your domain provider (GoDaddy, Namecheap, Cloudflare…). It can take a few minutes to an hour to work.</p>
              <table className="w-full table-fixed text-left text-xs">
                <thead>
                  <tr className="text-gray-400"><th className="w-14 py-1 font-normal">Type</th><th className="w-20 py-1 font-normal">Name</th><th className="py-1 font-normal">Value</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {state.records.map(record => (
                    <tr key={`${record.type}-${record.name}-${record.value}`}>
                      <td className="py-1.5">{record.type}</td>
                      <td className="truncate py-1.5">{record.name}</td>
                      <td className="py-1.5"><span className="break-all">{record.value}</span><CopyValue value={record.value} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500">Using Cloudflare? Set the record to “DNS only” (grey cloud).</p>
            </div>
          )}

          <button type="button" onClick={() => void disconnect()} disabled={busy} className="text-xs font-medium text-gray-500 hover:text-red-600 cursor-pointer">
            Disconnect domain
          </button>
        </div>
      )}
    </div>
  );
}
