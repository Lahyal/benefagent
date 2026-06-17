import { supabase } from './supabase';
import { hasProEntitlement } from './purchases';

export type UserPlan = 'trial' | 'pro' | 'none';

export type PlanState = {
  userPlan: UserPlan;
  trialEndsAt: Date | null;
  stripeCustomerId: string | null;
};

export async function loadPlanState(userId: string): Promise<PlanState> {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan,status,stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub?.status === 'active' && sub.plan) {
      return {
        userPlan: sub.plan === 'team' ? 'pro' : (sub.plan as UserPlan),
        trialEndsAt: null,
        stripeCustomerId: sub.stripe_customer_id || null,
      };
    }

    const rcPro = await hasProEntitlement();
    if (rcPro) {
      return { userPlan: 'pro', trialEndsAt: null, stripeCustomerId: sub?.stripe_customer_id || null };
    }
  } catch {
    /* fall through to trial */
  }

  try {
    let { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.trial_ends_at) {
      const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('profiles').upsert({ id: userId, trial_ends_at: end, onboarded: true });
      profile = { trial_ends_at: end };
    }

    const trialEndsAt = new Date(profile.trial_ends_at);
    return {
      userPlan: trialEndsAt > new Date() ? 'trial' : 'none',
      trialEndsAt,
      stripeCustomerId: null,
    };
  } catch {
    return { userPlan: 'none', trialEndsAt: null, stripeCustomerId: null };
  }
}
