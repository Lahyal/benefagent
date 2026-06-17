import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/Button';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { PaywallModal } from '../components/PaywallModal';
import { TOOLS, ToolItem } from '../constants/tools';
import { useApp } from '../context/AppContext';
import { purchasePro, restorePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const screenMap: Record<string, keyof RootStackParamList> = {
  analyzer: 'Analyzer',
  checker: 'Checker',
  claims: 'Claims',
  calculator: 'Calculator',
  history: 'History',
  settings: 'Settings',
};

export function MainScreen({ navigation }: Props) {
  const { email, stats, userPlan, trialEndsAt, benefits, refreshAll, requirePlan, hidePaywall } = useApp();
  const [initial, setInitial] = useState('?');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    refreshAll();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const name = u.user_metadata?.full_name || u.email || '?';
      setInitial(String(name).charAt(0).toUpperCase());
    });
  }, [refreshAll]);

  const onToolPress = useCallback(
    (tool: ToolItem) => {
      const route = screenMap[tool.id];
      if (!route) return;
      if (route === 'Calculator' || route === 'Settings' || route === 'History') {
        navigation.navigate(route);
        return;
      }
      if (!requirePlan()) return;
      navigation.navigate(route);
    },
    [navigation, requirePlan],
  );

  const onPurchase = async () => {
    setPurchasing(true);
    try {
      const ok = await purchasePro();
      if (ok) {
        hidePaywall();
        await refreshAll();
      }
    } catch (e: unknown) {
      Alert.alert('Subscription', e instanceof Error ? e.message : 'Configure RevenueCat keys in config.ts');
    } finally {
      setPurchasing(false);
    }
  };

  const onRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
      await refreshAll();
    } finally {
      setPurchasing(false);
    }
  };

  const trialText =
    userPlan === 'trial' && trialEndsAt
      ? `${Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)}d trial left`
      : userPlan === 'pro'
        ? 'Pro plan'
        : 'Trial ended';

  return (
    <>
      <ScreenBackground contentContainerStyle={styles.container}>
        <View style={styles.topbar}>
          <BrandLogo size="sm" />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>

        <Text style={styles.greeting}>{greeting()}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
        <Text style={styles.plan}>{trialText}</Text>

        <View style={styles.statRow}>
          <View style={[styles.statCard, styles.statCardDark]}>
            <Text style={[styles.statVal, styles.statValLight]}>${stats.found.toLocaleString()}</Text>
            <Text style={[styles.statLbl, styles.statLblLight]}>found for you</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>${stats.claimed.toLocaleString()}</Text>
            <Text style={styles.statLbl}>claimed</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.checks}</Text>
            <Text style={styles.statLbl}>expense checks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats.actions}</Text>
            <Text style={styles.statLbl}>actions</Text>
          </View>
        </View>

        <Card>
          <View style={styles.cardInner}>
            <Text style={styles.cardTitle}>{benefits ? 'Your action plan' : 'Get started'}</Text>
            <Text style={styles.cardSub}>
              {benefits?.summary ||
                'Upload your benefits PDF or check an expense — same AI as benefagent.com'}
            </Text>
            <Button label="Analyze my benefits" onPress={() => onToolPress(TOOLS[0])} style={styles.cardBtn} />
            <Button label="Check an expense" variant="ghost" onPress={() => onToolPress(TOOLS[1])} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>All tools</Text>
        <View style={styles.toolsGrid}>
          {TOOLS.map(tool => (
            <Pressable
              key={tool.id}
              onPress={() => onToolPress(tool)}
              style={[styles.toolCard, tool.featured && styles.toolCardFeatured]}>
              <Text style={styles.toolIcon}>{tool.icon}</Text>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolSub} numberOfLines={2}>
                {tool.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScreenBackground>
      <PaywallModal onPurchase={onPurchase} onRestore={onRestore} purchasing={purchasing} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  greeting: { ...typography.displayMedium, fontSize: 24 },
  email: { ...typography.bodySmall, marginTop: 4 },
  plan: { ...typography.caption, color: colors.accent, marginBottom: spacing.lg, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(14,14,13,0.07)',
  },
  statCardDark: { backgroundColor: colors.ink, borderColor: colors.ink },
  statVal: { fontFamily: typography.displayMedium.fontFamily, fontSize: 26, color: colors.ink, lineHeight: 30 },
  statValLight: { color: colors.paper },
  statLbl: { ...typography.caption, marginTop: 3 },
  statLblLight: { color: 'rgba(245,242,235,0.4)' },
  cardInner: { padding: spacing.lg },
  cardTitle: { ...typography.title, marginBottom: 6 },
  cardSub: { ...typography.bodySmall, marginBottom: spacing.md, lineHeight: 20 },
  cardBtn: { marginBottom: 8 },
  sectionTitle: { ...typography.title, marginBottom: spacing.md, marginTop: spacing.sm },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(14,14,13,0.07)',
    padding: 14,
  },
  toolCardFeatured: { borderColor: colors.accent, backgroundColor: colors.accentSoftBg },
  toolIcon: { fontSize: 24, marginBottom: 8 },
  toolTitle: { ...typography.title, fontSize: 14, marginBottom: 4 },
  toolSub: { ...typography.caption, lineHeight: 16 },
});
