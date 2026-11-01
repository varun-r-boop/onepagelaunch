import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscription } from '@/lib/plans-server';
import { isPro } from '@/lib/plans';

// GET -> the signed-in user's plan
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const subscription = await getSubscription(supabase, user.id);
  return NextResponse.json({
    plan: isPro(subscription) ? 'pro' : 'free',
    status: subscription?.status ?? null,
    renewsAt: subscription?.renews_at ?? null,
    endsAt: subscription?.ends_at ?? null,
    portalUrl: subscription?.portal_url ?? null,
  });
}
