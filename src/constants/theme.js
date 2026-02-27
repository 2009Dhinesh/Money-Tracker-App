// ─── Color Palette ────────────────────────────────────────────────
export const COLORS = {
  // Primary
  primary: '#6C63FF',
  primaryLight: '#8F89FF',
  primaryDark: '#4B44CC',

  // Semantic
  income: '#00C896',
  incomeLight: '#E6FBF5',
  expense: '#FF6B6B',
  expenseLight: '#FFF0F0',
  warning: '#FFB020',
  warningLight: '#FFF8EC',

  // Neutral (Light Mode)
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F1F8',
  border: '#E8E9F0',
  divider: '#F0F1F5',

  // Text
  textPrimary: '#1A1D2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Dark Mode
  dark: {
    background: '#0F0E17',
    surface: '#1A1927',
    surfaceAlt: '#221F35',
    border: '#2E2A45',
    divider: '#252238',
    textPrimary: '#EEEEF2',
    textSecondary: '#A09CBC',
    textTertiary: '#6B6788',
  },

  // Charts
  chartColors: [
    '#6C63FF', '#FF6B6B', '#FFB020', '#00C896',
    '#4ECDC4', '#FF8B94', '#A8E6CF', '#DCEDC1',
    '#85C1E9', '#D4A5A5', '#82E0AA', '#F8B500',
  ],

  // Gradients
  gradientPrimary: ['#6C63FF', '#9B5DE5'],
  gradientIncome: ['#00C896', '#00A878'],
  gradientExpense: ['#FF6B6B', '#E55555'],
  gradientCard: ['#1A1927', '#221F35'],
};

// ─── Typography ───────────────────────────────────────────────────
export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

// ─── Spacing ──────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

// ─── Border Radius ────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ─── Navigation Bar Height ────────────────────────────────────────
export const TAB_BAR_HEIGHT = 70;

export default { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS };
