import { Platform } from "react-native";

/**
 * Application Color Palette
 * Centralized color definitions for consistent theming
 */

export const Colors = {
  // Base colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Primary & Secondary
  primary: "#6366f1",
  primaryLight: "#8897f5",
  primaryDark: "#4f46e5",
  primaryAlpha90: "rgba(99, 102, 241, 0.9)",
  primaryAlpha15: "rgba(99, 102, 241, 0.15)",
  secondary: "#8b5cf6",
  purple: "#8b5cf6",

  // Status colors
  success: "#10b981",
  successLight: "#f0fdf4",
  successDark: "#16a34a",
  successBg: "#d1fae5",
  error: "#ff4757",
  errorDark: "#b91c1c",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  dangerBorder: "#fecaca",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  info: "#2563eb",
  infoLight: "#dbeafe",
  infoBackground: "#e0e7ff",
  infoDark: "#1e40af",

  // Background colors
  background: "#f8f9fa",
  backgroundLight: "#fff",
  backgroundGray: "#F9FAFB",
  backgroundInput: "#f9fafb",
  backgroundCard: "#fefefeff",
  offlineAlt: "#fef2f2",

  // Text colors
  textPrimary: "#1a1a1a",
  textSecondary: "#666",
  textTertiary: "#999",
  textQuaternary: "#030303ff",
  textMuted: "#6b7280",

  // Gray scale
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
  iconGray: "#6b7280",
  placeholderGray: "#9ca3af",

  // Border colors
  border: "#e9ecef",
  borderLight: "#f0f0f0",
  borderDark: "#e0e0e0",
  borderInput: "#d1d5db",
  borderGray: "#e5e7eb",
  borderDarkGray: "#d1d5db",
  lightGray: "#f0f0f0",

  // Overlay & Modal
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayDark: "rgba(0, 0, 0, 0.8)",
  overlayLight: "rgba(0, 0, 0, 0.3)",
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  modalBackground: "#FFFFFF",
  modalIconBg: "#e0e7ff",

  // White variants
  whiteTransparent: "rgba(255, 255, 255, 0.2)",
  whiteTransparent50: "rgba(255, 255, 255, 0.5)",
  whiteTransparent20Alpha: "rgba(255, 255, 255, 0.2)",
  whiteTransparent70: "rgba(255, 255, 255, 0.7)",
  whiteTransparent80: "rgba(255, 255, 255, 0.8)",
  whiteTransparent85: "rgba(255, 255, 255, 0.85)",
  whiteTransparent90: "rgba(255, 255, 255, 0.9)",

  // Black variants
  blackTransparent: "rgba(0, 0, 0, 0.3)",

  // Platform-specific colors
  platformBackground: "#f8f9fa",
  platformBackgroundAndroid: "#e1e1e8ff",
  platformBorderAndroid: "#e1e2e3ff",
  platformHole: "#dde4eaff",
  platformHoleAndroid: "#e8eff5ff",

  // Role-specific colors
  roleSuperBg: "#fef3c7",
  roleSuper: "#d97706",
  roleAdminBg: "#dbeafe",
  roleAdmin: "#2563eb",
  roleUserBg: "#f3f4f6",
  roleUser: "#374151",
  roleBannedBg: "#fee2e2",
  roleBanned: "#dc2626",

  // Gradient colors
  gradientPurple1: "#5865f2",
  gradientPurple2: "#8897f5",
  gradientEventForm1: "#8B5CF6",
  gradientEventForm2: "#6366F1",

  // Additional colors used in screens
  neutral333: "#333333",
  iconBadge: "#f3f4f6",
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
