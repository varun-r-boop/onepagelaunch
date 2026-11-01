// Server-only Lemon Squeezy helpers: hosted checkout and webhook verification.
// Env: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_VARIANT_ID (the $9/month Pro variant),
// LEMONSQUEEZY_WEBHOOK_SECRET.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.lemonsqueezy.com/v1';

export function billingConfigured(): boolean {
  return !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID && process.env.LEMONSQUEEZY_VARIANT_ID);
}

// Creates a checkout for the Pro plan and returns its URL. The user id travels
// as custom data so the webhook knows whose plan to upgrade.
export async function createProCheckout({ userId, email, redirectUrl }: { userId: string; email?: string; redirectUrl: string }): Promise<string> {
  const res = await fetch(`${API}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email, custom: { user_id: userId } },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store: { data: { type: 'stores', id: String(process.env.LEMONSQUEEZY_STORE_ID) } },
          variant: { data: { type: 'variants', id: String(process.env.LEMONSQUEEZY_VARIANT_ID) } },
        },
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  const url = json?.data?.attributes?.url;
  if (!res.ok || typeof url !== 'string') {
    throw new Error(`Lemon Squeezy checkout failed (${res.status}): ${JSON.stringify(json?.errors ?? json).slice(0, 300)}`);
  }
  return url;
}

// Webhooks are signed with an HMAC-SHA256 of the raw body (X-Signature header, hex)
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'), 'hex');
  const received = Buffer.from(signature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// The subscription fields we keep, as found in webhooks and the subscriptions API
export interface SubscriptionAttributes {
  store_id?: number | string;
  variant_id?: number | string;
  customer_id?: number | string;
  user_email?: string;
  status?: string;
  renews_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  urls?: { customer_portal?: string | null };
}

// The `subscriptions` row for a Lemon Squeezy subscription
export function subscriptionRow(userId: string, subscriptionId: string, attributes: SubscriptionAttributes) {
  return {
    user_id: userId,
    plan: 'pro' as const,
    status: attributes.status ?? null,
    ls_subscription_id: subscriptionId,
    ls_customer_id: attributes.customer_id != null ? String(attributes.customer_id) : null,
    renews_at: attributes.renews_at ?? null,
    ends_at: attributes.ends_at ?? null,
    portal_url: attributes.urls?.customer_portal ?? null,
    updated_at: new Date().toISOString(),
  };
}

// The newest subscription in our store bought with this email, straight from
// Lemon Squeezy. Used when a webhook hasn't arrived (yet).
export async function findSubscriptionByEmail(email: string): Promise<{ id: string; attributes: SubscriptionAttributes } | null> {
  const params = new URLSearchParams({
    'filter[store_id]': String(process.env.LEMONSQUEEZY_STORE_ID),
    'filter[user_email]': email,
  });
  if (process.env.LEMONSQUEEZY_VARIANT_ID) params.set('filter[variant_id]', String(process.env.LEMONSQUEEZY_VARIANT_ID));
  const res = await fetch(`${API}/subscriptions?${params}`, {
    headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}` },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Lemon Squeezy subscriptions lookup failed (${res.status}): ${JSON.stringify(json?.errors ?? json).slice(0, 300)}`);
  }
  const list: { id: string; attributes: SubscriptionAttributes }[] = Array.isArray(json?.data) ? json.data : [];
  list.sort((a, b) => String(b.attributes.created_at ?? '').localeCompare(String(a.attributes.created_at ?? '')));
  return list.find(s => s.attributes.status !== 'expired') ?? list[0] ?? null;
}
