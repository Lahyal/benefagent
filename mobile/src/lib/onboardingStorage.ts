import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = '@ba_mobile_onboarded';

export async function isOnboardingComplete(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
