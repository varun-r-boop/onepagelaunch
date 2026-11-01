import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { billingConfigured, findSubscriptionByEmail, subscriptionRow } from '@/lib/lemonsqueezy';
import { getSubscription } from '@/lib/plans-server';
import { isPro } from '@/lib/plans';

// POST -> re-reads the signed-in user's subscription from Lemon Squeezy and saves it.
// A fallback for when the webhook is late, failing, or not set up.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const current = await getSubscription(supabase, user.id);
  if (isPro(current)) return NextResponse.json({ plan: 'pro', synced: false });

  if (!billingConfigured() || !process.env.SUPABASE_SECRET_KEY || !user.email) {
    return NextResponse.json({ plan: 'free', synced: false, reason: 'not_configured' });
  }

  try {
    const found = await findSubscriptionByEmail(user.email);
    if (!found) return NextResponse.json({ plan: 'free', synced: false, reason: 'not_found' });

    const db = createAdminClient();
    // Never move a subscription that already belongs to another account
    const { data: owner } = await db.from('subscriptions').select('user_id').eq('ls_subscription_id', String(found.id)).maybeSingle();
    if (owner && owner.user_id !== user.id) {
      return NextResponse.json({ plan: 'free', synced: false, reason: 'not_found' });
    }

    const row = subscriptionRow(user.id, String(found.id), found.attributes);
    const { error } = await db.from('subscriptions').upsert(row, { onConflict: 'user_id' });
    if (error) {
      console.error('Billing sync: couldn’t save subscription', { code: error.code, message: error.message, details: error.details });
      return NextResponse.json({ error: 'Couldn’t save your plan' }, { status: 500 });
    }
    return NextResponse.json({ plan: isPro(row) ? 'pro' : 'free', synced: true });
  } catch (error) {
    console.error('Billing sync failed:', error);
    return NextResponse.json({ error: 'Couldn’t reach the billing provider' }, { status: 502 });
  }
}
