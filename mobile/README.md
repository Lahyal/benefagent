# BenefAgent Mobile

Bare **React Native** app (no Expo) for iOS and Android. Same Supabase backend and AI edge functions as [benefagent.com](https://benefagent.com).

## Features

| Screen | What it does |
|--------|----------------|
| Onboarding | Accounts + profile → saved locally, synced on first login |
| Login | Email OTP (8-digit), same Supabase project as web |
| Main | Dashboard stats + tool grid |
| Benefits Analyzer | PDF upload → `ai-agent` analyze |
| HSA/FSA Checker | Expense check + receipt photo scan |
| Claim Builder | Line items → AI claim form + history |
| 401k Calculator | Match gap estimate (local) |
| History | Analyses, checks, claims from Supabase |
| Settings | Profile, Pro upgrade (RevenueCat), legal links, delete account |

## Run locally

```bash
cd mobile
npm install
cd ios && bundle exec pod install && cd ..
npm run ios    # or npm run android
npm start      # Metro
```

Supabase config is generated from the repo root `.env` via `scripts/generate-supabase-config.js` (run from website setup).

## RevenueCat (required before store release)

1. Create a RevenueCat project at [app.revenuecat.com](https://app.revenuecat.com)
2. **App Store Connect**: subscription product `benefagent_pro_monthly` ($12/mo), bundle ID `com.benefagent.app`
3. **Google Play Console**: same subscription, package `com.benefagent.app`
4. Link both stores in RevenueCat; create entitlement **`pro`**
5. Paste public SDK keys into `src/lib/config.ts`:
   - `REVENUECAT_API_KEY_IOS`
   - `REVENUECAT_API_KEY_ANDROID`
6. Test purchase + restore on device (simulator IAP is limited)

Web billing stays on Stripe; mobile uses native IAP via RevenueCat. Trial logic reads `profiles.trial_ends_at` + RevenueCat entitlement.

## Store submission checklist

### Both stores
- [ ] App icons (replace default RN launcher icons)
- [ ] Screenshots (6.7", 6.5", iPad if supporting tablets; phone + 7" tablet Android)
- [ ] Privacy policy URL: https://benefagent.com/privacy.html
- [ ] Terms URL: https://benefagent.com/terms.html
- [ ] Support email: support@benefagent.com
- [ ] RevenueCat keys configured + test purchase on real device
- [ ] Test full flow: onboarding → OTP login → analyzer → checker → claim

### iOS (App Store Connect)
- [ ] Bundle ID: `com.benefagent.app`
- [ ] Display name: **BenefAgent**
- [ ] In-app purchase subscription linked in RevenueCat
- [ ] Export compliance, age rating, privacy nutrition labels
- [ ] Account deletion in Settings (data wipe + sign out)
- [ ] TestFlight build → submit for review

### Android (Play Console)
- [ ] Package: `com.benefagent.app`
- [ ] **Release signing keystore** (replace debug keystore in `android/app/build.gradle`)
- [ ] Subscription product + RevenueCat link
- [ ] Data safety form (email, health/financial data usage)
- [ ] Internal testing track → production

### Generate Android release keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore benefagent-release.keystore -alias benefagent -keyalg RSA -keysize 2048 -validity 10000
```

Wire `signingConfigs.release` in `android/app/build.gradle` before uploading to Play.

## Project structure

```
mobile/src/
  context/       AppContext (user, plan, stats, paywall)
  lib/           api, profile, plan, purchases, data, files, config
  screens/       all tool screens
  components/    Button, PaywallModal, ScreenHeader, …
  navigation/    stack + auth bootstrap
```

## Brand

| Token | Hex |
|-------|-----|
| paper | `#f5f2eb` |
| ink | `#0e0e0d` |
| accent | `#1a7a5e` |
