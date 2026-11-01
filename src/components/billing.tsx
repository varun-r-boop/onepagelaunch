'use client';

import * as React from 'react';
import { Check, Loader2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_FEATURES, PRO_PRICE_USD, type PlanId } from '@/lib/plans';

export interface PlanState {
  plan: PlanId;
  loading: boolean;
  portalUrl: string | null;
  endsAt: string | null;
  status: string | null;
}

interface PlanResult extends PlanState {
  // Re-reads the plan; with sync, first asks the server to pull it from Lemon Squeezy
  refresh: (options?: { sync?: boolean }) => Promise<PlanState>;
}

async function loadPlan(sync: boolean): Promise<Omit<PlanState, 'loading'> | null> {
  if (sync) await fetch('/api/billing/sync', { method: 'POST' }).catch(() => null);
  const res = await fetch('/api/billing/status', { cache: 'no-store' }).catch(() => null);
  const data = res?.ok ? await res.json().catch(() => null) : null;
  if (!data) return null;
  return {
    plan: data.plan === 'pro' ? 'pro' : 'free',
    portalUrl: data.portalUrl ?? null,
    endsAt: data.endsAt ?? null,
    status: data.status ?? null,
  };
}

// The signed-in user's plan. Pass enabled=false where there is no account (the playground).
export function usePlan(enabled = true): PlanResult {
  const [state, setState] = React.useState<PlanState>({ plan: 'free', loading: enabled, portalUrl: null, endsAt: null, status: null });
  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadPlan(false).then(data => {
      if (!cancelled) setState(s => (data ? { ...data, loading: false } : { ...s, loading: false }));
    });
    return () => { cancelled = true; };
  }, [enabled]);

  const refresh = React.useCallback(async ({ sync = false } = {}) => {
    const data = await loadPlan(sync);
    const next: PlanState = data ? { ...data, loading: false } : { plan: 'free', loading: false, portalUrl: null, endsAt: null, status: null };
    if (data) setState(next);
    return next;
  }, []);

  return { ...state, refresh };
}

// Sends the user to the Lemon Squeezy checkout for Pro
export async function startProCheckout(): Promise<void> {
  try {
    const res = await fetch('/api/billing/checkout', { method: 'POST' });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.url) throw new Error(result.error || 'Couldn’t start the checkout. Please try again.');
    window.location.href = result.url;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Couldn’t start the checkout. Please try again.');
  }
}

export function UpgradeButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => { setBusy(true); await startProCheckout(); setBusy(false); }}
      className={className ?? 'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer'}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {children ?? `Upgrade to Pro · $${PRO_PRICE_USD}/mo`}
    </button>
  );
}

// Shown in place of a Pro feature on the Free plan
export function ProLock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-gray-900">
        <Lock className="h-4 w-4 text-indigo-600" /> {title}
      </p>
      <p className="mt-1 text-gray-600">{description}</p>
      <ul className="my-3 space-y-1 text-gray-700">
        {PLAN_FEATURES.pro.slice(1).map(feature => (
          <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /> {feature}</li>
        ))}
      </ul>
      <UpgradeButton />
      <p className="mt-2 text-center text-xs text-gray-500">Cancel anytime.</p>
    </div>
  );
}
