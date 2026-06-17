import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import {
  REVENUECAT_API_KEY_ANDROID,
  REVENUECAT_API_KEY_IOS,
  REVENUECAT_ENTITLEMENT_ID,
} from './config';

let configured = false;

export async function configurePurchases(userId: string) {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey) return;
  if (configured) {
    await Purchases.logIn(userId);
    return;
  }
  Purchases.setLogLevel(LOG_LEVEL.INFO);
  Purchases.configure({ apiKey, appUserID: userId });
  configured = true;
}

export async function hasProEntitlement(): Promise<boolean> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey || !configured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

export async function getProPackage(): Promise<PurchasesPackage | null> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
}

export async function purchasePro(): Promise<boolean> {
  const pkg = await getProPackage();
  if (!pkg) throw new Error('Subscription not available yet. Configure RevenueCat and store products.');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
}

export async function restorePurchases(): Promise<boolean> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  if (!apiKey || !configured) return false;
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
}
