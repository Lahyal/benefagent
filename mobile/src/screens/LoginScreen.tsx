import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { BrandLogo } from '../components/BrandLogo';
import { Input } from '../components/Input';
import { ScreenBackground } from '../components/ScreenBackground';
import { supabase } from '../lib/supabase';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type Tab = 'login' | 'signup';

export function LoginScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onGoogle = () => {
    Alert.alert(
      'Google sign-in',
      'Native Google OAuth will be wired in a follow-up (URL scheme + Supabase redirect). Use email for now.',
    );
  };

  const onSubmit = async () => {
    setError('');
    setSuccess('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (tab === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        navigation.replace('Main');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setTab('login');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroStat}>$8,400</Text>
        <Text style={styles.heroLabel}>avg found per user</Text>
      </View>

      <View style={styles.card}>
        <BrandLogo />
        <Text style={styles.tagline}>
          Your AI benefits agent — finds every dollar you are missing
        </Text>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => { setTab('login'); setError(''); setSuccess(''); }}
            style={[styles.tab, tab === 'login' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Sign in</Text>
          </Pressable>
          <Pressable
            onPress={() => { setTab('signup'); setError(''); setSuccess(''); }}
            style={[styles.tab, tab === 'signup' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>Create account</Text>
          </Pressable>
        </View>

        <Pressable style={styles.googleBtn} onPress={onGoogle}>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or {tab === 'login' ? 'sign in' : 'sign up'} with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {error ? <Text style={styles.errorBox}>{error}</Text> : null}
        {success ? <Text style={styles.successBox}>{success}</Text> : null}

        {tab === 'signup' && (
          <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        )}
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder={tab === 'signup' ? 'At least 8 characters' : '••••••••'}
          secureTextEntry
        />

        <Button
          label={tab === 'login' ? 'Sign in' : 'Create account'}
          loading={loading}
          onPress={onSubmit}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  heroStat: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: 36,
    color: colors.paper,
  },
  heroLabel: {
    ...typography.caption,
    color: 'rgba(245,242,235,0.5)',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(14,14,13,0.07)',
    padding: spacing.lg,
  },
  tagline: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.paper2,
    borderRadius: radii.sm,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.ink3,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.ink,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  googleBtnText: {
    ...typography.title,
    fontSize: 14,
    color: colors.ink2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.ink3,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    color: colors.error,
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    fontSize: 13,
  },
  successBox: {
    backgroundColor: colors.successBg,
    color: colors.success,
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    fontSize: 13,
  },
});
