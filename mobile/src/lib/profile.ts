import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type UserProfile = {
  salary?: string;
  contrib?: string;
  family?: string;
  commute?: string;
  accounts?: string[];
};

const pendingKey = 'ba_pending_profile';

export async function savePendingProfile(profile: UserProfile) {
  await AsyncStorage.setItem(pendingKey, JSON.stringify(profile));
}

export async function syncPendingProfile(userId: string, email?: string) {
  const raw = await AsyncStorage.getItem(pendingKey);
  if (!raw) return;
  try {
    const profile = JSON.parse(raw) as UserProfile;
    await upsertProfile(userId, email, profile);
    await AsyncStorage.removeItem(pendingKey);
  } catch {
    /* ignore */
  }
}

export async function loadProfile(userId: string): Promise<UserProfile> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!data) return {};
  return {
    salary: data.salary ? String(data.salary) : '',
    contrib: data.contrib_pct != null ? String(data.contrib_pct) : '',
    family: data.family_status || 'single',
    commute: data.commute_type || 'transit',
    accounts: (data.accounts as string[]) || [],
  };
}

export async function upsertProfile(userId: string, email: string | undefined, profile: UserProfile) {
  await supabase.from('profiles').upsert({
    id: userId,
    email,
    salary: profile.salary ? parseInt(profile.salary, 10) : null,
    contrib_pct: profile.contrib ? parseFloat(profile.contrib) : null,
    family_status: profile.family || 'single',
    commute_type: profile.commute || 'transit',
    accounts: profile.accounts || [],
    updated_at: new Date().toISOString(),
  });
}

export function profileToContext(profile: UserProfile) {
  const accounts = profile.accounts || [];
  return {
    salary: profile.salary || null,
    contrib: profile.contrib || null,
    family: profile.family || 'single',
    commute: profile.commute || 'transit',
    accounts,
    hasHSA: accounts.includes('hsa'),
    hasFSA: accounts.includes('fsa'),
  };
}
