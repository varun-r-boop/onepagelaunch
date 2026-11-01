'use client';

import * as React from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Analytics } from '@/app/api/analytics/route';
import { ProLock, type PlanState } from '@/components/billing';

const RANGES = [7, 30] as const;

const formatDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const formatPercent = (value: number | null) => (value === null ? '–' : `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`);

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// Daily unique visitors: one series, so the title names it and no legend is needed.
// Each column is a hover target showing that day's numbers.
function VisitorsChart({ days }: { days: Analytics['days'] }) {
  const max = Math.max(1, ...days.map(d => d.visitors));
  return (
    <figure>
      <figcaption className="mb-2 text-xs font-semibold text-gray-700">Daily visitors</figcaption>
      <div className="relative">
        <span className="absolute right-0 -top-4 text-[10px] text-gray-400">{max}</span>
        <div className="flex h-28 items-end gap-[2px] border-b border-gray-200" role="img" aria-label={`Daily visitors, ${days.length} days`}>
          {days.map((day, i) => (
            <div key={day.date} className="group/bar relative flex h-full flex-1 items-end" tabIndex={0}>
              {day.visitors > 0 && (
                <div className="w-full rounded-t-[4px] bg-indigo-600 group-hover/bar:bg-indigo-700" style={{ height: `${(day.visitors / max) * 100}%` }} />
              )}
              <div className={cn(
                'pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] leading-4 text-white shadow-lg group-hover/bar:block group-focus/bar:block',
                // Keep the tooltip inside the panel at either edge
                i < days.length / 3 ? 'left-0' : i > (days.length * 2) / 3 ? 'right-0' : 'left-1/2 -translate-x-1/2',
              )}>
                <span className="font-semibold">{formatDay(day.date)}</span><br />
                {day.visitors} visitors · {day.views} views<br />
                {day.signups} sign-ups
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>{formatDay(days[0].date)}</span>
          <span>{formatDay(days[days.length - 1].date)}</span>
        </div>
      </div>
    </figure>
  );
}

export default function AnalyticsPanel({ projectId, plan }: { projectId: string; plan: PlanState }) {
  const [range, setRange] = React.useState<(typeof RANGES)[number]>(30);
  const [data, setData] = React.useState<Analytics | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // Which range the shown data is for; while it differs from the selected one, a load is in flight
  const [loadedRange, setLoadedRange] = React.useState<number | null>(null);
  const loading = loadedRange !== range;

  React.useEffect(() => {
    if (plan.loading || plan.plan !== 'pro') return;
    let cancelled = false;
    fetch(`/api/analytics?projectId=${encodeURIComponent(projectId)}&days=${range}`)
      .then(async res => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Failed to load analytics');
        return body as Analytics;
      })
      .then(body => { if (!cancelled) { setData(body); setError(null); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics'); })
      .finally(() => { if (!cancelled) setLoadedRange(range); });
    return () => { cancelled = true; };
  }, [projectId, range, plan.loading, plan.plan]);

  if (plan.loading) {
    return <p className="flex items-center gap-2 p-5 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  }
  if (plan.plan !== 'pro') {
    return (
      <div className="p-5">
        <ProLock title="Analytics is a Pro feature" description="See how many people visit your page, where they come from, and how many join." />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5 text-sm">
      {/* Filter row above the numbers */}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-semibold text-gray-900"><BarChart3 className="h-4 w-4" /> Last {range} days</p>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="Date range">
          {RANGES.map(r => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn('rounded-md px-2 py-0.5 text-xs font-medium cursor-pointer', range === r ? 'bg-white shadow-sm' : 'text-gray-500')}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {error === 'setup_needed' ? (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Analytics isn’t set up yet. Run <code>supabase/migrations/20261102000000_plans_analytics_domains.sql</code> in the Supabase SQL editor and set <code>SUPABASE_SECRET_KEY</code> on the server.
        </p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
      ) : !data ? (
        <p className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : (
        <div className={cn('space-y-5', loading && 'opacity-60')}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Visitors" value={data.totals.visitors.toLocaleString()} />
            <Stat label="Sign-ups" value={data.totals.signups.toLocaleString()} />
            <Stat label="Conversion" value={formatPercent(data.totals.conversion)} hint="visitors who joined" />
            <Stat label="Page views" value={data.totals.views.toLocaleString()} />
          </div>

          {data.totals.views === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-center text-xs text-gray-500">
              No visits yet. Publish your page and share the link. Visits show up here within seconds.
            </p>
          ) : (
            <>
              <VisitorsChart days={data.days} />
              <table className="w-full text-left text-xs">
                <caption className="mb-1 text-left font-semibold text-gray-700">Where visitors come from</caption>
                <thead>
                  <tr className="text-gray-400"><th className="py-1 font-normal">Source</th><th className="py-1 text-right font-normal">Visitors</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.referrers.map(r => (
                    <tr key={r.source}><td className="truncate py-1.5 text-gray-900">{r.source}</td><td className="py-1.5 text-right tabular-nums text-gray-700">{r.visitors}</td></tr>
                  ))}
                </tbody>
              </table>
              {data.countries.length > 0 && (
                <table className="w-full text-left text-xs">
                  <caption className="mb-1 text-left font-semibold text-gray-700">Top countries</caption>
                  <tbody className="divide-y divide-gray-100">
                    {data.countries.map(c => (
                      <tr key={c.country}><td className="py-1.5 text-gray-900">{c.country}</td><td className="py-1.5 text-right tabular-nums text-gray-700">{c.visitors}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
