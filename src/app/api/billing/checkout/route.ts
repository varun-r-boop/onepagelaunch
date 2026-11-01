import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { billingConfigured, createProCheckout } from '@/lib/lemonsqueezy';
import { getSubscription } from '@/lib/plans-server';
import { isPro } from '@/lib/plans';

// POST -> { url } of a Lemon Squeezy checkout for the Pro plan
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to upgrade.' }, { status: 401 });

  if (!billingConfigured()) {
    console.error('Billing is not configured: set LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID and LEMONSQUEEZY_VARIANT_ID.');
    return NextResponse.json({ error: 'Upgrades aren’t available yet. Please try again later.' }, { status: 503 });
  }

  // Already Pro: send them to manage their subscription instead
  const subscription = await getSubscription(supabase, user.id);
  if (isPro(subscription)) {
    return NextResponse.json({ url: subscription?.portal_url ?? `${request.nextUrl.origin}/dashboard` });
  }

  try {
    const url = await createProCheckout({
      userId: user.id,
      email: user.email,
      redirectUrl: `${request.nextUrl.origin}/dashboard?upgraded=1`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Couldn’t start the checkout. Please try again.' }, { status: 502 });
  }
}
