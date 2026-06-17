import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { colors, radii, spacing, typography } from '../theme';

type Props = {
  onPurchase: () => void;
  onRestore: () => void;
  purchasing?: boolean;
};

export function PaywallModal({ onPurchase, onRestore, purchasing }: Props) {
  const { paywallVisible, hidePaywall, userPlan, trialEndsAt } = useApp();

  let subtitle = 'Upgrade to keep access to all your benefits tools.';
  if (userPlan === 'trial' && trialEndsAt) {
    const ms = trialEndsAt.getTime() - Date.now();
    const days = Math.ceil(ms / 86400000);
    subtitle = `${Math.max(days, 0)} day${days === 1 ? '' : 's'} left in your free trial. Upgrade to keep full access.`;
  }

  return (
    <Modal visible={paywallVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>{userPlan === 'none' ? 'Your trial has ended' : 'Upgrade to Pro'}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
          <View style={styles.list}>
            {[
              'Unlimited HSA/FSA AI checks',
              'Full benefits PDF analyzer',
              'Receipt scanner & claim builder',
            ].map(line => (
              <Text key={line} style={styles.line}>
                • {line}
              </Text>
            ))}
          </View>
          <Button label="Get Pro — $12/month" loading={purchasing} onPress={onPurchase} />
          <Pressable onPress={onRestore} style={styles.restore}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </Pressable>
          {userPlan === 'trial' ? (
            <Pressable onPress={hidePaywall} style={styles.restore}>
              <Text style={styles.restoreText}>Continue trial</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14,14,13,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
  },
  icon: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: { ...typography.title, fontSize: 22, textAlign: 'center', marginBottom: 8 },
  sub: { ...typography.bodySmall, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  list: { marginBottom: 20, gap: 6 },
  line: { ...typography.bodySmall, color: colors.ink2 },
  restore: { marginTop: 14, alignItems: 'center' },
  restoreText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
});
