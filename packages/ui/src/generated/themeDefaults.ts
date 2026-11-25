/* Generated from packages/tokens/tokens.json by scripts/theme-defaults.ts. Do not edit by hand. */

/** The default accent (the light theme's accent token). */
export const DEFAULT_ACCENT = '#2457d6';

/** Light and dark values of the grounds setAccent checks contrast on, used when tokens.css is not loaded. */
export const GROUNDS = {
  bg: {
    light: '#fcfbfb',
    dark: '#2f2a25',
  },
  surface: {
    light: '#ffffff',
    dark: '#393530',
  },
  'surface-sub': {
    light: '#f6f5f4',
    dark: '#443f3b',
  },
  'surface-chrome': {
    light: '#ffffff',
    dark: '#3d3834',
  },
  ink: {
    light: '#171512',
    dark: '#f6f5f4',
  },
} as const;

/** The presets of tokens.json: their color scheme and accent. */
export const PRESETS = {
  teaching: {
    scheme: 'light',
    accent: '#027874',
  },
} as const;

export type ThemePreset = keyof typeof PRESETS;
