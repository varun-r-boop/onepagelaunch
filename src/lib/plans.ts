// Free and Pro plans. Pro is a Lemon Squeezy subscription; see src/lib/lemonsqueezy.ts.

export type PlanId = 'free' | 'pro';

export const PRO_PRICE_USD = 9;

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    'One page with every section',
    'Waitlist with CSV export',
    'Social preview image for shared links',
    'Your page at onepagelaunch.vercel.app/your-product',
  ],
  pro: [
    'Everything in Free',
    'Analytics: visitors, sign-ups, conversion, referrers',
    'Custom domain (yourproduct.com)',
  ],
};

export interface Subscription {
  plan: PlanId;
  status: string | null;
  ends_at: string | null;
  renews_at: string | null;
  portal_url: string | null;
}

// Lemon Squeezy statuses that still give access. A cancelled subscription
// keeps Pro until the end of the period it was paid for.
export function isPro(subscription: Subscription | null | undefined, now = Date.now()): boolean {
  if (!subscription || subscription.plan !== 'pro') return false;
  if (['active', 'on_trial', 'past_due'].includes(subscription.status ?? '')) return true;
  return subscription.status === 'cancelled' && !!subscription.ends_at && new Date(subscription.ends_at).getTime() > now;
}
