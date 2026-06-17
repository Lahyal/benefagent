import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { colors, spacing, typography } from '../theme';

type Row = { title: string; sub: string; meta: string };

export function HistoryScreen() {
  const { userId } = useApp();
  const [analyses, setAnalyses] = useState<Row[]>([]);
  const [checks, setChecks] = useState<Row[]>([]);
  const [claims, setClaims] = useState<Row[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [a, c, cl] = await Promise.all([
        supabase.from('benefits_results').select('employer,total_opportunity,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('check_history').select('expense,verdict,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(15),
        supabase.from('claim_history').select('claim_number,total_amount,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      ]);
      setAnalyses((a.data || []).map(r => ({
        title: r.employer || 'Analysis',
        sub: `$${Math.round(r.total_opportunity || 0).toLocaleString()} opportunity`,
        meta: new Date(r.created_at).toLocaleDateString(),
      })));
      setChecks((c.data || []).map(r => ({
        title: r.expense,
        sub: r.verdict,
        meta: new Date(r.created_at).toLocaleDateString(),
      })));
      setClaims((cl.data || []).map(r => ({
        title: r.claim_number || 'Claim',
        sub: `$${Number(r.total_amount || 0).toFixed(2)}`,
        meta: new Date(r.created_at).toLocaleDateString(),
      })));
    })();
  }, [userId]);

  const Section = ({ title, rows }: { title: string; rows: Row[] }) => (
    <>
      <Text style={styles.section}>{title}</Text>
      {rows.length ? rows.map((r, i) => (
        <Card key={`${title}-${i}`}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{r.title}</Text>
              <Text style={styles.sub}>{r.sub}</Text>
            </View>
            <Text style={styles.meta}>{r.meta}</Text>
          </View>
        </Card>
      )) : (
        <Text style={styles.empty}>Nothing yet</Text>
      )}
    </>
  );

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <ScreenHeader title="History" subtitle="Analyses, checks, and claims" />
      <Section title="Benefits analyses" rows={analyses} />
      <Section title="Expense checks" rows={checks} />
      <Section title="Claims" rows={claims} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  section: { ...typography.title, marginTop: 8, marginBottom: 10 },
  row: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  title: { ...typography.body, fontWeight: '500', fontSize: 14 },
  sub: { ...typography.caption, marginTop: 2 },
  meta: { ...typography.caption, color: colors.ink3 },
  empty: { ...typography.bodySmall, color: colors.ink3, marginBottom: 16 },
});
