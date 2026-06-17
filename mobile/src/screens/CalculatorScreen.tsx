import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { colors, spacing, typography } from '../theme';

export function CalculatorScreen() {
  const [salary, setSalary] = useState('75000');
  const [matchPct, setMatchPct] = useState('4');
  const [contrib, setContrib] = useState('0');
  const [hsa, setHsa] = useState(true);
  const [show, setShow] = useState(false);

  const run = () => {
    setShow(true);
  };

  const sal = parseFloat(salary) || 75000;
  const match = parseFloat(matchPct) || 4;
  const c = parseFloat(contrib) || 0;
  const gap = Math.max(0, match - c);
  const matchMissed = sal * gap / 100;
  const hsaSav = hsa ? Math.round(4300 * 0.25) : 0;
  const total = Math.round(matchMissed + hsaSav + 1200);

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <ScreenHeader title="401k Calculator" subtitle="Estimate your employer match opportunity" />
      <Input label="Annual salary ($)" value={salary} onChangeText={setSalary} keyboardType="number-pad" />
      <Input label="Employer match (%)" value={matchPct} onChangeText={setMatchPct} keyboardType="decimal-pad" />
      <Input label="Your contribution (%)" value={contrib} onChangeText={setContrib} keyboardType="decimal-pad" />
      <View style={styles.row}>
        <Button
          label={hsa ? 'HSA eligible ✓' : 'No HSA'}
          variant={hsa ? 'primary' : 'ghost'}
          onPress={() => setHsa(true)}
          style={styles.half}
        />
        <Button label="No HSA" variant={!hsa ? 'primary' : 'ghost'} onPress={() => setHsa(false)} style={styles.half} />
      </View>
      <Button label="Calculate" onPress={run} />
      {show ? (
        <Card>
          <View style={styles.cardInner}>
            <Text style={styles.total}>${total.toLocaleString()}/yr</Text>
            <Text style={styles.line}>401k match gap: ${Math.round(matchMissed).toLocaleString()}/yr</Text>
            <Text style={styles.line}>HSA tax savings: ${hsaSav.toLocaleString()}/yr</Text>
          </View>
        </Card>
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  half: { flex: 1 },
  cardInner: { padding: spacing.lg },
  total: { fontFamily: typography.displayMedium.fontFamily, fontSize: 32, color: colors.accent, marginBottom: 12 },
  line: { ...typography.bodySmall, marginBottom: 4 },
});
