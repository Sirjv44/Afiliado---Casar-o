export const COLORS = {
  // Primary brand colors
  primary: '#FF1F00', // Red
  primaryDark: '#D01700',
  primaryLight: '#FF4D33',
  
  // Secondary colors
  secondary: '#1E1E1E', // Almost black
  secondaryDark: '#121212',
  secondaryLight: '#2D2D2D',
  
  // Accents
  accent: '#FFD600', // Gold/Yellow for highlights
  
  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background colors
  background: '#121212',
  card: '#1E1E1E',
  cardAlt: '#252525',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  textDisabled: '#666666',
  
  // Border colors
  border: '#333333',
  divider: '#2A2A2A',
  
  // Transparent colors for overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Other utility colors
  placeholder: '#666666',
  disabled: '#333333',
  highlight: '#FF1F00', // Same as primary for consistency
};

export default {
  light: {
    text: COLORS.text,
    background: COLORS.background,
    tint: COLORS.primary,
    tabIconDefault: COLORS.textSecondary,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: COLORS.text,
    background: COLORS.background,
    tint: COLORS.primary,
    tabIconDefault: COLORS.textSecondary,
    tabIconSelected: COLORS.primary,
  },
};