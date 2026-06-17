import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { useApp } from '../context/AppContext';
import { buildClaim } from '../lib/api';
import { ClaimItem, loadClaimDraft, saveClaimDraft } from '../lib/data';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Claims'>;

export function ClaimsScreen(_props: Props) {
  const { userId, requirePlan, refreshAll } = useApp();
  const [items, setItems] = useState<ClaimItem[]>([]);
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [employer, setEmployer] = useState('');
  const [accountType, setAccountType] = useState('hsa');
  const [manual, setManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimOut, setClaimOut] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadClaimDraft(userId).then(setItems);
  }, [userId]);

  const persist = async (next: ClaimItem[]) => {
    setItems(next);
    if (userId) await saveClaimDraft(userId, next);
  };

  const addItem = () => {
    const line = manual.trim();
    if (!line) return;
    const amountMatch = line.match(/\$?\s*([\d,.]+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
    persist([
      ...items,
      { id: Date.now(), desc: line, amount, date: new Date().toLocaleDateString() },
    ]);
    setManual('');
  };

  const removeItem = (id: number) => persist(items.filter(i => i.id !== id));

  const generate = async () => {
    if (!requirePlan()) return;
    if (!items.length) {
      setError('Add at least one expense');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const expenses = items
        .map(i => `${i.desc} - $${i.amount.toFixed(2)} - ${i.date}`)
        .join('\n');
      const claim = await buildClaim({
        name,
        memberId,
        accountType,
        employer,
        period: new Date().getFullYear().toString(),
        expenses,
      });
      setClaimOut(claim);
      if (userId) {
        await supabase.from('claim_history').insert({
          user_id: userId,
          claim_number: claim.claim_number,
          total_amount: claim.total_amount || 0,
          account_type: claim.account_type,
          employer: claim.employer,
        });
        await refreshAll();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not build claim');
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <ScreenHeader title="Claim Builder" subtitle="Generate a ready-to-submit claim" />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Input label="Full name" value={name} onChangeText={setName} />
      <Input label="Member / plan ID" value={memberId} onChangeText={setMemberId} />
      <Input label="Employer" value={employer} onChangeText={setEmployer} />

      {items.map(i => (
        <Card key={i.id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemDesc}>{i.desc}</Text>
              <Text style={styles.itemMeta}>{i.date}</Text>
            </View>
            <Text style={styles.itemAmt}>${i.amount.toFixed(2)}</Text>
            <Text style={styles.remove} onPress={() => removeItem(i.id)}>
              ×
            </Text>
          </View>
        </Card>
      ))}

      <Input
        label="Add expense"
        value={manual}
        onChangeText={setManual}
        placeholder="CVS prescription - $47.50"
        onSubmitEditing={addItem}
      />
      <Button label="Add line item" variant="ghost" onPress={addItem} />

      {items.length ? (
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      ) : null}

      <Button label={loading ? 'Building…' : 'Generate claim'} loading={loading} onPress={generate} />

      {claimOut ? (
        <Card>
          <View style={styles.cardInner}>
            <Text style={styles.claimTitle}>Claim {String(claimOut.claim_number || '')}</Text>
            <Text style={styles.claimTotal}>${Number(claimOut.total_amount || 0).toFixed(2)}</Text>
            <Text style={styles.instructions}>{String(claimOut.submission_instructions || '')}</Text>
          </View>
        </Card>
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  error: { backgroundColor: colors.errorBg, color: colors.error, padding: 12, borderRadius: 10, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  itemDesc: { ...typography.body, fontSize: 14 },
  itemMeta: { ...typography.caption, marginTop: 2 },
  itemAmt: { fontWeight: '600' },
  remove: { fontSize: 22, color: colors.ink3, paddingHorizontal: 4 },
  total: { ...typography.title, textAlign: 'right', marginVertical: 8 },
  cardInner: { padding: spacing.lg },
  claimTitle: { ...typography.title, marginBottom: 4 },
  claimTotal: { fontFamily: typography.displayMedium.fontFamily, fontSize: 28, color: colors.accent },
  instructions: { ...typography.bodySmall, marginTop: 12, lineHeight: 20 },
});
