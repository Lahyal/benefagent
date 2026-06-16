# BenefAgent Mobile

Bare **React Native** app (no Expo) for iOS and Android. Matches [benefagent.com](https://benefagent.com) brand colors and core product flows.

## Screens (v1)

1. **Onboarding** — 3-step setup (accounts, profile details, action plan) mirroring `app.html`
2. **Login** — Email OTP sign-in with Supabase (same project as the website)
3. **Main** — Dashboard + tool grid: Benefits Analyzer, HSA/FSA Checker, Claim Builder, 401k Calculator, History, Settings

Tool screens show placeholders; next step is wiring each to the existing Supabase edge functions.

## Brand tokens

From website CSS variables:

| Token | Hex |
|-------|-----|
| paper | `#f5f2eb` |
| ink | `#0e0e0d` |
| accent | `#1a7a5e` |
| accent2 | `#d4541a` |
| gold | `#c9a84c` |

Typography targets **DM Serif Display** + **DM Sans** (system serif/sans fallback until font files are linked).

## Prerequisites

- Node ≥ 22
- Xcode + CocoaPods (iOS)
- Android Studio + SDK (Android)

## Run

```bash
cd mobile
npm install

# iOS (first time)
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios

# Android
npm run android

# Metro
npm start
```

## Project structure

```
mobile/
  src/
    theme/          # colors, typography
    components/     # Button, Input, BrandLogo, ScreenBackground
    screens/        # Onboarding, Login, Main
    navigation/     # stack + auth bootstrap
    lib/            # supabase, onboarding storage
    constants/      # tools list
```

## Next steps

- [ ] Implement each tool screen + API calls
- [ ] App Store / Play billing (RevenueCat)
- [ ] Link DM Sans / DM Serif Display font files in `assets/fonts`
