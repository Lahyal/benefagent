import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  back: { marginBottom: 8 },
  backText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  title: { ...typography.displayMedium, fontSize: 24 },
  sub: { ...typography.bodySmall, marginTop: 4 },
});
