import { Platform, TextStyle } from 'react-native';

/** DM Serif Display / DM Sans — falls back to system serif/sans until fonts are linked */
export const fonts = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }) as string,
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
  bodyMedium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }) as string,
};

export const typography = {
  displayLarge: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: '#0e0e0d',
  } satisfies TextStyle,
  displayMedium: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: '#0e0e0d',
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    fontWeight: '500',
    color: '#0e0e0d',
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#3a3a36',
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#888880',
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    fontWeight: '500',
    color: '#3a3a36',
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#888880',
  } satisfies TextStyle,
};
