import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';

interface SubscriptionEvent {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: {
    type?: string;
    id?: string;
    attributes?: {
      store_id?: number | string;
      customer_id?: number | string;
      status?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      urls?: { customer_portal?: string | null };
    };
  };
}

// Lemon Squeezy calls this for subscription_created/updated/cancelled/resumed/expired/... events.
// Configure it in Lemon Squeezy → Settings → Webhooks with the same signing secret.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get('x-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    console.error('Billing webhook: SUPABASE_SECRET_KEY is not set, so the plan can’t be saved.');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  let event: SubscriptionEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = event.meta?.event_name ?? '';
  const attributes = event.data?.attributes;
  if (!name.startsWith('subscription_') || event.data?.type !== 'subscriptions' || !attributes) {
    // Not a subscription event (e.g. order_created): acknowledge and ignore
    return NextResponse.json({ received: true });
  }
  if (process.env.LEMONSQUEEZY_STORE_ID && String(attributes.store_id) !== String(process.env.LEMONSQUEEZY_STORE_ID)) {
    return NextResponse.json({ received: true });
  }

  const db = createAdminClient();
  const subscriptionId = String(event.data?.id);

  // The user id is attached at checkout; later events may only be matched by subscription id
  let userId = event.meta?.custom_data?.user_id;
  if (!userId) {
    const { data } = await db.from('subscriptions').select('user_id').eq('ls_subscription_id', subscriptionId).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) {
    console.error(`Billing webhook: no user for subscription ${subscriptionId} (${name})`);
    return NextResponse.json({ received: true });
  }

  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    plan: 'pro',
    status: attributes.status ?? null,
    ls_subscription_id: subscriptionId,
    ls_customer_id: attributes.customer_id != null ? String(attributes.customer_id) : null,
    renews_at: attributes.renews_at ?? null,
    ends_at: attributes.ends_at ?? null,
    portal_url: attributes.urls?.customer_portal ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('Billing webhook: couldn’t save subscription', { code: error.code, message: error.message, details: error.details });
    // Non-2xx makes Lemon Squeezy retry later
    return NextResponse.json({ error: 'Couldn’t save' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
