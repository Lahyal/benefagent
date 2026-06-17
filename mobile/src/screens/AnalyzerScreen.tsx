import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { useApp } from '../context/AppContext';
import { analyzeBenefits, BenefitsResult } from '../lib/api';
import { saveBenefits } from '../lib/data';
import { readFileBase64, mediaTypeFromName } from '../lib/files';
import { profileToContext } from '../lib/profile';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyzer'>;

export function AnalyzerScreen({ navigation }: Props) {
  const { profile, userId, requirePlan, setBenefits } = useApp();
  const [fileName, setFileName] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [salary, setSalary] = useState(profile.salary || '');
  const [contrib, setContrib] = useState(profile.contrib || '');
  const [family, setFamily] = useState(profile.family || 'single');
  const [commute, setCommute] = useState(profile.commute || 'transit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BenefitsResult | null>(null);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const uri = res.fileCopyUri || res.uri;
      setFileUri(uri);
      setFileName(res.name || 'Document');
      setError('');
    } catch (e: unknown) {
      if (DocumentPicker.isCancel(e)) return;
      setError(e instanceof Error ? e.message : 'Could not open file');
    }
  };

  const analyze = async () => {
    if (!requirePlan()) return;
    if (!fileUri || !userId) {
      setError('Choose a benefits document first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const base64 = await readFileBase64(fileUri);
      const mediaType = mediaTypeFromName(fileName);
      const ctx = profileToContext({ salary, contrib, family, commute, accounts: profile.accounts });
      const data = await analyzeBenefits(base64, mediaType, ctx);
      await saveBenefits(userId, data);
      setResult(data);
      setBenefits(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const total =
    result?.total_opportunity ||
    (result?.actions || []).reduce((s, a) => s + (a.estimated_annual_value || 0), 0) ||
    0;

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <ScreenHeader title="Benefits Analyzer" subtitle="Upload your employer benefits document" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!result ? (
        <>
          <Card>
            <View style={styles.cardInner}>
              <Text style={styles.pickLabel}>Document</Text>
              <Text style={styles.fileName}>{fileName || 'No file selected'}</Text>
              <Button label="Choose PDF or image" variant="ghost" onPress={pickFile} />
            </View>
          </Card>
          <Input label="Annual salary ($)" value={salary} onChangeText={setSalary} keyboardType="number-pad" />
          <Input label="401k contribution (%)" value={contrib} onChangeText={setContrib} keyboardType="decimal-pad" />
          <Button label={loading ? 'Analyzing…' : 'Analyze with AI'} loading={loading} onPress={analyze} />
          <Text style={styles.note}>Results are saved to your account. The original file is not stored.</Text>
        </>
      ) : (
        <>
          <Card>
            <View style={styles.cardInner}>
              <Text style={styles.employer}>{result.employer || 'Your benefits'}</Text>
              <Text style={styles.total}>${Math.round(total).toLocaleString()}/yr opportunity</Text>
              <Text style={styles.summary}>{result.summary}</Text>
            </View>
          </Card>
          {(result.actions || []).map((a, i) => (
            <Card key={`${a.title}-${i}`}>
              <View style={styles.cardInner}>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.actionDesc}>{a.description}</Text>
                {a.estimated_annual_value ? (
                  <Text style={styles.actionVal}>+${Number(a.estimated_annual_value).toLocaleString()}/yr</Text>
                ) : null}
              </View>
            </Card>
          ))}
          <Button label="View dashboard" onPress={() => navigation.navigate('Main')} />
          <Button label="Analyze another" variant="ghost" onPress={() => setResult(null)} />
        </>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Reading document with AI…</Text>
        </View>
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.sm },
  cardInner: { padding: spacing.lg },
  pickLabel: { ...typography.label, marginBottom: 6 },
  fileName: { ...typography.body, marginBottom: 12 },
  note: { ...typography.caption, textAlign: 'center', marginTop: 12 },
  error: { backgroundColor: colors.errorBg, color: colors.error, padding: 12, borderRadius: 10, marginBottom: 12 },
  employer: { ...typography.title, marginBottom: 4 },
  total: { fontFamily: typography.displayMedium.fontFamily, fontSize: 32, color: colors.accent, marginBottom: 8 },
  summary: { ...typography.bodySmall, lineHeight: 20 },
  actionTitle: { ...typography.title, fontSize: 15, marginBottom: 4 },
  actionDesc: { ...typography.bodySmall, marginBottom: 6 },
  actionVal: { color: colors.accent, fontWeight: '600' },
  loading: { alignItems: 'center', marginTop: 24, gap: 8 },
  loadingText: { color: colors.ink3, fontSize: 13 },
});
