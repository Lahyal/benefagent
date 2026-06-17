import AsyncStorage from '@react-native-async-storage/async-storage';
import { BenefitsResult } from './api';
import { supabase } from './supabase';

export type ClaimItem = {
  id: number;
  desc: string;
  amount: number;
  date: string;
};

export type DashboardStats = {
  found: number;
  claimed: number;
  checks: number;
  actions: number;
};

export async function loadLatestBenefits(userId: string): Promise<BenefitsResult | null> {
  const { data } = await supabase
    .from('benefits_results')
    .select('raw_json,total_opportunity')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.raw_json as BenefitsResult) || null;
}

export async function saveBenefits(userId: string, benefits: BenefitsResult) {
  const total =
    benefits.total_opportunity ||
    (benefits.actions || []).reduce((s, a) => s + (a.estimated_annual_value || 0), 0);
  const { data: result } = await supabase
    .from('benefits_results')
    .insert({
      user_id: userId,
      employer: benefits.employer || 'Unknown',
      raw_json: benefits,
      total_opportunity: total,
    })
    .select()
    .single();
  if (result && benefits.actions?.length) {
    await supabase.from('benefit_actions').insert(
      benefits.actions.map(a => ({
        user_id: userId,
        result_id: result.id,
        title: a.title,
        description: a.description,
        estimated_value: a.estimated_annual_value || 0,
        priority: a.priority || 'medium',
      })),
    );
  }
}

export async function loadDashboardStats(userId: string): Promise<DashboardStats> {
  const [benefits, checks, claims] = await Promise.all([
    loadLatestBenefits(userId),
    supabase.from('check_history').select('id').eq('user_id', userId),
    supabase.from('claim_history').select('total_amount').eq('user_id', userId),
  ]);
  const found =
    benefits?.total_opportunity ||
    (benefits?.actions || []).reduce((s, a) => s + (a.estimated_annual_value || 0), 0) ||
    0;
  const claimed = (claims.data || []).reduce((s, c) => s + (c.total_amount || 0), 0);
  return {
    found: Math.round(found),
    claimed: Math.round(claimed),
    checks: checks.data?.length || 0,
    actions: benefits?.actions?.length || 0,
  };
}

const claimKey = (userId: string) => `ba_claims_${userId}`;

export async function loadClaimDraft(userId: string): Promise<ClaimItem[]> {
  const raw = await AsyncStorage.getItem(claimKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveClaimDraft(userId: string, items: ClaimItem[]) {
  await AsyncStorage.setItem(claimKey(userId), JSON.stringify(items));
}

export async function deleteAccount(userId: string) {
  await supabase.from('benefit_actions').delete().eq('user_id', userId);
  await supabase.from('benefits_results').delete().eq('user_id', userId);
  await supabase.from('check_history').delete().eq('user_id', userId);
  await supabase.from('claim_history').delete().eq('user_id', userId);
  await supabase.from('subscriptions').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.signOut();
}
