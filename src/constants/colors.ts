import { Platform } from "react-native";

/**
 * Application Color Palette
 * Centralized color definitions for consistent theming
 */

export const Colors = {
  // Primary Brand Colors
  primary: "#6366f1",
  primaryLight: "#8897f5",
  primaryDark: "#4f46e5",
  primaryAlpha90: "rgba(99, 102, 241, 0.9)",
  primaryAlpha15: "rgba(99, 102, 241, 0.15)",

  // Secondary Colors
  secondary: "#10b981",
  secondaryLight: "#34d399",
  secondaryDark: "#059669",

  // Danger/Error Colors
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  dangerBorder: "#fecaca",
  error: "#ff4757",
  errorLight: "#fef3c7",
  errorDark: "#b91c1c",

  // Warning Colors
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  warningBg: "#fef3c7",

  // Success Colors
  success: "#10b981",
  successLight: "#f0fdf4",
  successDark: "#16a34a",
  successBg: "#d1fae5",

  // Info Colors
  info: "#2563eb",
  infoLight: "#dbeafe",
  infoBackground: "#e0e7ff",
  infoDark: "#3b82f6",

  // Neutral Colors
  white: "#fff",
  whiteFFF: "#ffffff",
  black: "#000",
  neutral333: "#333333",

  // Gray Scale
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",

  // Background Colors
  background: "#f8f9fa",
  backgroundLight: "#fff",
  backgroundDark: "#f0f0f0",
  backgroundCard: "#fefefeff",
  backgroundInput: "#f9fafb",

  // Text Colors
  textPrimary: "#1a1a1a",
  textSecondary: "#666",
  textTertiary: "#999",
  textQuaternary: "#030303ff",
  textLight: "#9ca3af",
  textMuted: "#6b7280",
  textDark: "#4b5563",

  // Border Colors
  border: "#e9ecef",
  borderLight: "#f0f0f0",
  borderDark: "#e0e0e0",
  borderGray: "#7b7a7aff",
  borderDarkGray: "#434242ff",
  borderInput: "#d1d5db",

  // Overlay & Shadow
  overlay: "rgba(0,0,0,0.5)",
  overlayDark: "rgba(0,0,0,0.8)",
  overlayLight: "rgba(0,0,0,0.3)",
  shadow: "#000",

  // Transparent & Semi-transparent
  transparent: "transparent",
  whiteTransparent: "rgba(255,255,255,0.2)",
  whiteTransparent05: "rgba(255,255,255,0.05)",
  whiteTransparent70: "rgba(255,255,255,0.7)",
  whiteTransparent80: "rgba(255,255,255,0.8)",
  whiteTransparent85: "rgba(255,255,255,0.85)",
  whiteTransparent90: "rgba(255,255,255,0.9)",
  whiteTransparent20Alpha: "rgba(255, 255, 255, 0.2)",
  blackTransparent: "rgba(0,0,0,0.3)",
  blackTransparent05: "rgba(0,0,0,0.05)",

  // Platform-specific
  platformBackground: "#f8f9fa",
  platformBackgroundAndroid: "#e1e1e8ff",
  platformBackgroundAndroidAlt: "rgba(240, 242, 244, 1)",
  platformBorder: "#e9ecef",
  platformBorderAndroid: "#e1e2e3ff",
  platformHole: "#dde4eaff",
  platformHoleAndroid: "#e8eff5ff",

  // Status Colors
  offline: "#fee2e2",
  offlineAlt: "#fff1f2",
  online: "#d1fae5",
  pending: "#fef3c7",

  // Gradient Colors
  gradientPurple1: "#5865f2",
  gradientPurple2: "#8897f5",
  gradientPrimary1: "#6366f1",
  gradientPrimary2: "#8b5cf6",
  gradientEventForm1: "#8B5CF6",
  gradientEventForm2: "#6366F1",

  // Special UI Colors
  tabIndicator: "#10b981",
  placeholder: "#999",
  iconBadge: "#f3f0ff",
  qrBackground: "#fff",

  // Additional UI Colors
  headerTint: "#000000ff",
  modalIconBg: "#EEF2FF",
  toggleTrackFalse: "#E5E7EB",
  toggleTrackTrue: "#8B5CF6",
  toggleThumbActive: "#6366F1",
  toggleThumbInactive: "#f4f3f4",

  // Role-specific colors
  roleSuper: "#d97706",
  roleSuperBg: "#fef3c7",
  roleAdmin: "#2563eb",
  roleAdminBg: "#dbeafe",
  roleUser: "#374151",
  roleUserBg: "#f3f4f6",
  roleBanned: "#dc2626",
  roleBannedBg: "#fee2e2",
} as const;

// Type for color keys
export type ColorKey = keyof typeof Colors;

// Helper function to get platform-specific colors
export const getPlatformColor = (
  iosColor: ColorKey,
  androidColor: ColorKey
): string => {
  return Platform.OS === "ios" ? Colors[iosColor] : Colors[androidColor];
};
