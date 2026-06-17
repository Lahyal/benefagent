import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { useApp } from '../context/AppContext';
import { checkEligibility, EligibilityResult, scanReceipt } from '../lib/api';
import { readFileBase64 } from '../lib/files';
import { profileToContext } from '../lib/profile';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checker'>;

const QUICK = ['Prescription glasses', 'Therapy session', 'Sunscreen', 'Dental cleaning'];

export function CheckerScreen({ navigation }: Props) {
  const { profile, userId, requirePlan, refreshAll } = useApp();
  const [mode, setMode] = useState<'type' | 'receipt'>('type');
  const [expense, setExpense] = useState('');
  const [amount, setAmount] = useState('');
  const [accountType, setAccountType] = useState('hsa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [receiptName, setReceiptName] = useState('');

  const ctx = () => profileToContext(profile);

  const runCheck = async (text?: string) => {
    if (!requirePlan()) return;
    const q = (text ?? expense).trim();
    if (!q) {
      setError('Enter an expense to check');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await checkEligibility(q, accountType, ctx());
      setResult(r);
      if (userId) {
        await supabase.from('check_history').insert({
          user_id: userId,
          expense: q,
          account_type: accountType,
          eligible: r.eligible,
          verdict: r.verdict,
          explanation: r.explanation,
          estimated_savings: r.estimated_annual_savings || 0,
        });
        await refreshAll();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  const scanFile = async () => {
    if (!requirePlan()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let uri = '';
      let name = '';
      let mediaType = 'image/jpeg';
      const img = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (img.didCancel || !img.assets?.[0]?.uri) {
        setLoading(false);
        return;
      }
      uri = img.assets[0].uri!;
      name = img.assets[0].fileName || 'receipt.jpg';
      mediaType = img.assets[0].type || 'image/jpeg';
      setReceiptName(name);
      const base64 = await readFileBase64(uri);
      const r = await scanReceipt(base64, mediaType, accountType, ctx());
      setResult({
        eligible: 'yes',
        verdict: `$${Number(r.eligible_total || 0).toFixed(2)} eligible`,
        explanation: r.summary || `Receipt from ${r.store || 'store'} — $${Number(r.total || 0).toFixed(2)} total`,
        estimated_annual_savings: r.eligible_total || 0,
      });
      if (userId) {
        await supabase.from('check_history').insert({
          user_id: userId,
          expense: `Receipt: ${r.store || name}`,
          account_type: accountType,
          eligible: 'yes',
          verdict: `$${Number(r.eligible_total || 0).toFixed(2)} eligible`,
          explanation: r.summary || '',
          estimated_savings: r.eligible_total || 0,
        });
        await refreshAll();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const badgeStyle =
    result?.eligible === 'yes'
      ? styles.yes
      : result?.eligible === 'partial'
        ? styles.partial
        : styles.no;

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <ScreenHeader title="HSA / FSA Checker" subtitle="Instant AI eligibility check" />

      <View style={styles.tabs}>
        <Button
          label="Type expense"
          variant={mode === 'type' ? 'primary' : 'ghost'}
          onPress={() => setMode('type')}
          style={styles.tabBtn}
        />
        <Button
          label="Scan receipt"
          variant={mode === 'receipt' ? 'primary' : 'ghost'}
          onPress={() => setMode('receipt')}
          style={styles.tabBtn}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {mode === 'type' ? (
        <>
          <Input label="What did you buy?" value={expense} onChangeText={setExpense} placeholder="e.g. prescription glasses" />
          <Input label="Amount (optional)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="150" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            {QUICK.map(q => (
              <Text key={q} style={styles.chip} onPress={() => { setExpense(q); runCheck(q); }}>
                {q}
              </Text>
            ))}
          </ScrollView>
          <Button label={loading ? 'Checking…' : 'Check eligibility'} loading={loading} onPress={() => runCheck()} />
        </>
      ) : (
        <>
          <Text style={styles.receiptHint}>{receiptName || 'Choose a receipt photo or PDF'}</Text>
          <Button label={loading ? 'Scanning…' : 'Scan receipt with AI'} loading={loading} onPress={scanFile} />
        </>
      )}

      {result ? (
        <Card>
          <View style={[styles.cardInner, badgeStyle]}>
            <Text style={styles.verdict}>{result.verdict}</Text>
            <Text style={styles.explanation}>{result.explanation}</Text>
            {result.estimated_annual_savings ? (
              <Text style={styles.savings}>Est. savings: ${result.estimated_annual_savings}/yr</Text>
            ) : null}
          </View>
        </Card>
      ) : null}

      <Button label="Open claim builder" variant="ghost" onPress={() => navigation.navigate('Claims')} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1 },
  error: { backgroundColor: colors.errorBg, color: colors.error, padding: 12, borderRadius: 10, marginBottom: 12 },
  quickRow: { marginBottom: 12, maxHeight: 40 },
  chip: {
    backgroundColor: colors.paper2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    overflow: 'hidden',
    fontSize: 13,
    color: colors.ink2,
  },
  receiptHint: { ...typography.bodySmall, marginBottom: 12 },
  cardInner: { padding: spacing.lg, borderRadius: 12 },
  yes: { backgroundColor: colors.successBg },
  partial: { backgroundColor: 'rgba(201,168,76,0.15)' },
  no: { backgroundColor: colors.errorBg },
  verdict: { ...typography.title, marginBottom: 6 },
  explanation: { ...typography.bodySmall, lineHeight: 20 },
  savings: { marginTop: 8, fontWeight: '600', color: colors.accent },
});
