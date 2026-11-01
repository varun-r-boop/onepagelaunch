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
