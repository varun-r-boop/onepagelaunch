// Server-only plan lookups
import type { SupabaseClient } from '@supabase/supabase-js';
import { isPro, type PlanId, type Subscription } from './plans';

export async function getSubscription(db: SupabaseClient, userId: string): Promise<Subscription | null> {
  const { data } = await db
    .from('subscriptions')
    .select('plan, status, ends_at, renews_at, portal_url')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

export async function getPlan(db: SupabaseClient, userId: string): Promise<PlanId> {
  return isPro(await getSubscription(db, userId)) ? 'pro' : 'free';
}
