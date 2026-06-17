import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { useApp } from '../context/AppContext';
import { deleteAccount } from '../lib/data';
import { LEGAL } from '../lib/config';
import { purchasePro, restorePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { email, userPlan, trialEndsAt, profile, saveProfile, refreshAll, hidePaywall } = useApp();
  const [salary, setSalary] = useState(profile.salary || '');
  const [contrib, setContrib] = useState(profile.contrib || '');
  const [family, setFamily] = useState(profile.family || 'single');
  const [commute, setCommute] = useState(profile.commute || 'transit');
  const [busy, setBusy] = useState(false);

  const planLabel =
    userPlan === 'pro'
      ? 'Pro'
      : userPlan === 'trial' && trialEndsAt
        ? `Trial · ${Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)}d left`
        : 'Expired';

  const save = async () => {
    await saveProfile({ ...profile, salary, contrib, family, commute });
    Alert.alert('Saved', 'Profile updated.');
  };

  const upgrade = async () => {
    setBusy(true);
    try {
      const ok = await purchasePro();
      if (ok) {
        hidePaywall();
        await refreshAll();
        Alert.alert('Welcome to Pro', 'Your subscription is active.');
      }
    } catch (e: unknown) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const ok = await restorePurchases();
      await refreshAll();
      Alert.alert(ok ? 'Restored' : 'No purchases found', ok ? 'Pro access restored.' : 'No active subscription on this account.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your BenefAgent data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) await deleteAccount(data.user.id);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
    );
  };

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <ScreenHeader title="Settings" subtitle={email || ''} />

      <Card>
        <View style={styles.cardInner}>
          <Text style={styles.planLabel}>Plan: {planLabel}</Text>
          {userPlan !== 'pro' ? (
            <>
              <Button label="Upgrade to Pro" loading={busy} onPress={upgrade} style={styles.gap} />
              <Button label="Restore purchases" variant="ghost" onPress={restore} />
            </>
          ) : null}
        </View>
      </Card>

      <Text style={styles.section}>Profile</Text>
      <Input label="Annual salary ($)" value={salary} onChangeText={setSalary} keyboardType="number-pad" />
      <Input label="401k contribution (%)" value={contrib} onChangeText={setContrib} keyboardType="decimal-pad" />
      <Button label="Save profile" variant="ghost" onPress={save} />

      <Text style={styles.section}>Legal</Text>
      <Button label="Privacy policy" variant="ghost" onPress={() => Linking.openURL(LEGAL.privacy)} />
      <Button label="Terms of service" variant="ghost" onPress={() => Linking.openURL(LEGAL.terms)} />

      <Text style={styles.section}>Account</Text>
      <Button
        label="Sign out"
        variant="ghost"
        onPress={async () => {
          await supabase.auth.signOut();
          navigation.replace('Login');
        }}
      />
      <Button label="Delete account" variant="ghost" onPress={confirmDelete} style={styles.delete} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  cardInner: { padding: spacing.lg },
  planLabel: { ...typography.title, marginBottom: 12 },
  gap: { marginBottom: 8 },
  section: { ...typography.title, marginTop: 16, marginBottom: 8 },
  delete: { marginTop: 8 },
});
