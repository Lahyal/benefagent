import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { BenefitsResult } from '../lib/api';
import { DashboardStats, loadDashboardStats, loadLatestBenefits } from '../lib/data';
import { loadPlanState, UserPlan } from '../lib/plan';
import { loadProfile, syncPendingProfile, upsertProfile, UserProfile } from '../lib/profile';
import { configurePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';

type AppContextValue = {
  userId: string | null;
  email: string | null;
  profile: UserProfile;
  userPlan: UserPlan;
  trialEndsAt: Date | null;
  benefits: BenefitsResult | null;
  stats: DashboardStats;
  paywallVisible: boolean;
  refreshAll: () => Promise<void>;
  saveProfile: (next: UserProfile) => Promise<void>;
  setBenefits: (b: BenefitsResult | null) => void;
  requirePlan: () => boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
};

const defaultStats: DashboardStats = { found: 0, claimed: 0, checks: 0, actions: 0 };

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({});
  const [userPlan, setUserPlan] = useState<UserPlan>('none');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [benefits, setBenefitsState] = useState<BenefitsResult | null>(null);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const refreshAll = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setUserId(null);
      setEmail(null);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);
    await syncPendingProfile(user.id, user.email);
    await configurePurchases(user.id);
    const [prof, plan, latest, dashStats] = await Promise.all([
      loadProfile(user.id),
      loadPlanState(user.id),
      loadLatestBenefits(user.id),
      loadDashboardStats(user.id),
    ]);
    setProfile(prof);
    setUserPlan(plan.userPlan);
    setTrialEndsAt(plan.trialEndsAt);
    setBenefitsState(latest);
    setStats(dashStats);
    if (plan.userPlan === 'none') setPaywallVisible(true);
    else setPaywallVisible(false);
  }, []);

  const saveProfile = useCallback(
    async (next: UserProfile) => {
      if (!userId) return;
      setProfile(next);
      await upsertProfile(userId, email ?? undefined, next);
    },
    [email, userId],
  );

  const setBenefits = useCallback((b: BenefitsResult | null) => {
    setBenefitsState(b);
    if (b) {
      const total =
        b.total_opportunity ||
        (b.actions || []).reduce((s, a) => s + (a.estimated_annual_value || 0), 0);
      setStats(prev => ({
        ...prev,
        found: Math.round(total),
        actions: b.actions?.length || 0,
      }));
    }
  }, []);

  const requirePlan = useCallback(() => {
    if (userPlan === 'none') {
      setPaywallVisible(true);
      return false;
    }
    return true;
  }, [userPlan]);

  const value = useMemo(
    () => ({
      userId,
      email,
      profile,
      userPlan,
      trialEndsAt,
      benefits,
      stats,
      paywallVisible,
      refreshAll,
      saveProfile,
      setBenefits,
      requirePlan,
      showPaywall: () => setPaywallVisible(true),
      hidePaywall: () => setPaywallVisible(false),
    }),
    [
      userId,
      email,
      profile,
      userPlan,
      trialEndsAt,
      benefits,
      stats,
      paywallVisible,
      refreshAll,
      saveProfile,
      setBenefits,
      requirePlan,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
