import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { BrandLogo } from '../components/BrandLogo';
import { Input } from '../components/Input';
import { ScreenBackground } from '../components/ScreenBackground';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { refreshAll } = useApp();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const sendOtp = async (isResend = false) => {
    clearMessages();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setOtpEmail(trimmed);
      setOtpSent(true);
      setSuccess(`We sent an 8-digit code to ${trimmed}. Check your inbox.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    clearMessages();
    const addr = otpEmail || email.trim();
    const token = otp.replace(/\s/g, '');
    if (!addr) {
      setError('Enter your email first');
      return;
    }
    if (!/^\d{8}$/.test(token)) {
      setError('Enter the 8-digit code from your email');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: addr,
        token,
        type: 'email',
      });
      if (verifyError) throw verifyError;
      await refreshAll();
      navigation.replace('Main');
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
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          We'll email you an 8-digit code. New here? Same flow — your account is created automatically.
        </Text>

        {error ? <Text style={styles.errorBox}>{error}</Text> : null}
        {success ? <Text style={styles.successBox}>{success}</Text> : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {otpSent ? (
          <>
            <Input
              label="Verification code"
              value={otp}
              onChangeText={setOtp}
              placeholder="00000000"
              keyboardType="number-pad"
              maxLength={8}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              editable={!loading}
              style={styles.otpInput}
            />
            <Button label="Verify & sign in" loading={loading} onPress={verifyOtp} />
            <Button
              label="Resend code"
              variant="ghost"
              loading={false}
              disabled={loading}
              onPress={() => sendOtp(true)}
              style={styles.resendBtn}
            />
          </>
        ) : (
          <Button label="Send sign-in code" loading={loading} onPress={() => sendOtp()} />
        )}
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
  title: {
    ...typography.title,
    fontSize: 22,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  otpInput: {
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  resendBtn: {
    marginTop: spacing.sm,
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
