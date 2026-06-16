import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../components/BrandLogo';
import { Button } from '../components/Button';
import { Card, ScreenBackground } from '../components/ScreenBackground';
import { TOOLS, ToolItem } from '../constants/tools';
import { supabase } from '../lib/supabase';
import { colors, radii, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function MainScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [initial, setInitial] = useState('?');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? '');
      const name = u.user_metadata?.full_name || u.email || '?';
      setInitial(String(name).charAt(0).toUpperCase());
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  }, [navigation]);

  const onToolPress = useCallback(
    (tool: ToolItem) => {
      if (tool.id === 'settings') {
        Alert.alert('Settings', 'Account settings & billing — coming in next sprint.', [
          { text: 'Sign out', style: 'destructive', onPress: signOut },
          { text: 'OK' },
        ]);
        return;
      }
      Alert.alert(tool.title, `${tool.subtitle}\n\nThis tool will connect to the same AI backend as the website.`);
    },
    [signOut],
  );

  return (
    <ScreenBackground contentContainerStyle={styles.container}>
      <View style={styles.topbar}>
        <BrandLogo size="sm" />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      <Text style={styles.greeting}>{greeting()}</Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}

      <View style={styles.statRow}>
        <View style={[styles.statCard, styles.statCardDark]}>
          <Text style={[styles.statVal, styles.statValLight]}>$0</Text>
          <Text style={[styles.statLbl, styles.statLblLight]}>found so far</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>0</Text>
          <Text style={styles.statLbl}>checks run</Text>
        </View>
      </View>

      <Card>
        <View style={styles.cardInner}>
          <Text style={styles.cardTitle}>Start here</Text>
          <Text style={styles.cardSub}>
            Upload your benefits PDF or check an expense — same tools as benefagent.com
          </Text>
          <Button
            label="Analyze my benefits"
            onPress={() => onToolPress(TOOLS[0])}
            style={styles.cardBtn}
          />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>All tools</Text>
      <View style={styles.toolsGrid}>
        {TOOLS.map(tool => (
          <Pressable
            key={tool.id}
            onPress={() => onToolPress(tool)}
            style={[styles.toolCard, tool.featured && styles.toolCardFeatured]}>
            <Text style={styles.toolIcon}>{tool.icon}</Text>
            <Text style={styles.toolTitle}>{tool.title}</Text>
            <Text style={styles.toolSub} numberOfLines={2}>
              {tool.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button label="Sign out" variant="ghost" onPress={signOut} style={styles.signOut} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  greeting: {
    ...typography.displayMedium,
    fontSize: 24,
  },
  email: {
    ...typography.bodySmall,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(14,14,13,0.07)',
  },
  statCardDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  statVal: {
    fontFamily: typography.displayMedium.fontFamily,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 32,
  },
  statValLight: {
    color: colors.paper,
  },
  statLbl: {
    ...typography.caption,
    marginTop: 3,
  },
  statLblLight: {
    color: 'rgba(245,242,235,0.4)',
  },
  cardInner: {
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.title,
    marginBottom: 6,
  },
  cardSub: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  cardBtn: {
    marginTop: 4,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(14,14,13,0.07)',
    padding: 14,
  },
  toolCardFeatured: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoftBg,
  },
  toolIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  toolTitle: {
    ...typography.title,
    fontSize: 14,
    marginBottom: 4,
  },
  toolSub: {
    ...typography.caption,
    lineHeight: 16,
  },
  signOut: {
    marginTop: spacing.xl,
  },
});
