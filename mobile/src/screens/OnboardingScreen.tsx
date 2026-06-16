import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { BrandLogo, BrandMark } from '../components/BrandLogo';
import { ScreenBackground } from '../components/ScreenBackground';
import { ONBOARDING_ACCOUNTS, ONBOARDING_PLAN } from '../constants/tools';
import { setOnboardingComplete } from '../lib/onboardingStorage';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [salary, setSalary] = useState('');
  const [contrib, setContrib] = useState('');
  const [family, setFamily] = useState('single');
  const [commute, setCommute] = useState('transit');

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const finish = async () => {
    await setOnboardingComplete();
    navigation.replace('Login');
  };

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <BrandMark size={36} />
        <BrandLogo size="sm" />
      </View>

      <View style={styles.pips}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.pip, step === i && styles.pipActive, step > i && styles.pipDone]} />
        ))}
      </View>

      {step === 0 && (
        <View>
          <Text style={styles.title}>Welcome to BenefAgent 🎉</Text>
          <Text style={styles.sub}>
            Your AI benefits agent. Let's set up your profile to find every dollar you are missing.
            What accounts do you have?
          </Text>
          {ONBOARDING_ACCOUNTS.map(item => {
            const selected = selectedAccounts.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleAccount(item.id)}
                style={[styles.option, selected && styles.optionSelected]}>
                <Text style={styles.optionIcon}>{item.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  <Text style={styles.optionSub}>{item.sub}</Text>
                </View>
              </Pressable>
            );
          })}
          <View style={styles.navRow}>
            <Text style={styles.stepHint}>Step 1 of 3</Text>
            <Button label="Continue →" fullWidth={false} style={styles.navBtn} onPress={() => setStep(1)} />
          </View>
        </View>
      )}

      {step === 1 && (
        <View>
          <Text style={styles.title}>A few quick details</Text>
          <Text style={styles.sub}>
            Helps our AI give more accurate dollar amounts and recommendations.
          </Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Annual salary ($)</Text>
              <TextInput
                style={styles.fieldInput}
                keyboardType="number-pad"
                placeholder="75000"
                placeholderTextColor={colors.ink3}
                value={salary}
                onChangeText={setSalary}
              />
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Current 401k %</Text>
              <TextInput
                style={styles.fieldInput}
                keyboardType="decimal-pad"
                placeholder="3"
                placeholderTextColor={colors.ink3}
                value={contrib}
                onChangeText={setContrib}
              />
            </View>
          </View>
          <Text style={styles.fieldLabel}>Family status</Text>
          <View style={styles.chipRow}>
            {(['single', 'married', 'family'] as const).map(v => (
              <Pressable
                key={v}
                onPress={() => setFamily(v)}
                style={[styles.chip, family === v && styles.chipActive]}>
                <Text style={[styles.chipText, family === v && styles.chipTextActive]}>
                  {v === 'single' ? 'Single' : v === 'married' ? 'Married' : 'Family'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Commute type</Text>
          <View style={styles.chipRow}>
            {(['transit', 'drive', 'remote'] as const).map(v => (
              <Pressable
                key={v}
                onPress={() => setCommute(v)}
                style={[styles.chip, commute === v && styles.chipActive]}>
                <Text style={[styles.chipText, commute === v && styles.chipTextActive]}>
                  {v === 'transit' ? 'Transit' : v === 'drive' ? 'Drive' : 'Remote'}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.navRow, { marginTop: spacing.xl }]}>
            <Button label="Back" variant="ghost" fullWidth={false} style={styles.navBtn} onPress={() => setStep(0)} />
            <Button label="Continue →" fullWidth={false} style={styles.navBtn} onPress={() => setStep(2)} />
          </View>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.title}>You are set! ✨</Text>
          <Text style={styles.sub}>Here's your 3-step plan to start finding money:</Text>
          {ONBOARDING_PLAN.map((item, idx) => (
            <View
              key={item.step}
              style={[styles.planRow, idx === 0 ? styles.planRowAccent : styles.planRowMuted]}>
              <View style={[styles.planNum, idx === 0 && styles.planNumAccent]}>
                <Text style={styles.planNumText}>{item.step}</Text>
              </View>
              <View style={styles.planText}>
                <Text style={styles.planTitle}>{item.title}</Text>
                <Text style={styles.planSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
          <View style={[styles.navRow, { marginTop: spacing.xl }]}>
            <Button label="Back" variant="ghost" fullWidth={false} style={styles.navBtn} onPress={() => setStep(1)} />
            <Button label="Go to my dashboard →" fullWidth={false} style={styles.navBtnFlex} onPress={finish} />
          </View>
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  pips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
  },
  pip: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.paper2,
  },
  pipActive: {
    backgroundColor: colors.accent,
  },
  pipDone: {
    backgroundColor: colors.accent,
    opacity: 0.45,
  },
  title: {
    ...typography.displayMedium,
    marginBottom: spacing.sm,
  },
  sub: {
    ...typography.body,
    fontWeight: '300',
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoftBg,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    ...typography.title,
    fontSize: 14,
  },
  optionSub: {
    ...typography.caption,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: 10,
  },
  stepHint: {
    ...typography.bodySmall,
  },
  navBtn: {
    minWidth: 100,
    paddingHorizontal: 16,
  },
  navBtnFlex: {
    flex: 1,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  gridItem: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 6,
  },
  fieldInput: {
    ...typography.body,
    fontSize: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoftBg,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.ink2,
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radii.sm,
    marginBottom: 10,
  },
  planRowAccent: {
    backgroundColor: colors.accentSoftBg,
  },
  planRowMuted: {
    backgroundColor: colors.paper2,
  },
  planNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ink2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planNumAccent: {
    backgroundColor: colors.accent,
  },
  planNumText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    ...typography.title,
    fontSize: 13,
  },
  planSub: {
    ...typography.caption,
    marginTop: 2,
  },
});
