import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
};

export function BrandLogo({ size = 'md' }: Props) {
  const fontSize = size === 'lg' ? 28 : size === 'sm' ? 18 : 22;
  return (
    <Text style={[styles.logo, { fontSize }]}>
      Benef<Text style={styles.accent}>Agent</Text>
    </Text>
  );
}

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={[styles.markLetter, { fontSize: size * 0.55 }]}>B</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    ...typography.displayMedium,
    fontSize: 22,
  },
  accent: {
    color: colors.accent,
  },
  mark: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: typography.displayMedium.fontFamily,
    color: colors.white,
    fontWeight: '600',
  },
});
