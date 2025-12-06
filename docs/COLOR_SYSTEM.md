# Color System Guide

## Table of Contents
- [Overview](#overview)
- [Why Use Color Constants](#why-use-color-constants)
- [Available Colors](#available-colors)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)
- [Platform-Specific Colors](#platform-specific-colors)

## Overview

The application uses a centralized color system defined in `src/constants/colors.ts`. All colors are accessed through the `Colors` object to ensure consistency, maintainability, and theme support.

### Benefits
- ✅ **Consistency**: Single source of truth for all colors
- ✅ **Maintainability**: Change theme in one place
- ✅ **Type Safety**: Auto-complete and type checking
- ✅ **Platform Awareness**: Handle iOS/Android differences
- ✅ **Accessibility**: Easier to maintain contrast ratios

## Why Use Color Constants

### Before (Hardcoded Colors) ❌
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
  text: {
    color: '#1a1a1a',
  },
});
```

### After (Color Constants) ✅
```typescript
import { Colors } from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
  },
  text: {
    color: Colors.textPrimary,
  },
});
```

## Available Colors

### Primary & Brand Colors
```typescript
Colors.primary           // #6366f1 - Main brand color
Colors.primaryLight      // #8897f5 - Lighter variant
Colors.primaryDark       // #4f46e5 - Darker variant
Colors.primaryAlpha90    // rgba(99, 102, 241, 0.9)
Colors.primaryAlpha15    // rgba(99, 102, 241, 0.15)
```

### Secondary Colors
```typescript
Colors.secondary         // #10b981
Colors.secondaryLight    // #34d399
Colors.secondaryDark     // #059669
```

### Status Colors
```typescript
// Success
Colors.success           // #10b981
Colors.successLight      // #f0fdf4
Colors.successDark       // #16a34a
Colors.successBg         // #d1fae5

// Error/Danger
Colors.danger            // #ef4444
Colors.dangerLight       // #fee2e2
Colors.dangerBorder      // #fecaca
Colors.error             // #ff4757
Colors.errorDark         // #b91c1c

// Warning
Colors.warning           // #f59e0b
Colors.warningLight      // #fef3c7

// Info
Colors.info              // #2563eb
Colors.infoLight         // #dbeafe
Colors.infoBackground    // #e0e7ff
```

### Gray Scale
```typescript
Colors.gray50            // #f9fafb - Lightest
Colors.gray100           // #f3f4f6
Colors.gray200           // #e5e7eb
Colors.gray300           // #d1d5db
Colors.gray400           // #9ca3af
Colors.gray500           // #6b7280
Colors.gray600           // #4b5563
Colors.gray700           // #374151
Colors.gray800           // #1f2937
Colors.gray900           // #111827 - Darkest
```

### Background Colors
```typescript
Colors.background        // #f8f9fa - Main background
Colors.backgroundLight   // #fff - Light background
Colors.backgroundInput   // #f9fafb - Input fields
Colors.backgroundCard    // #fefefeff - Card backgrounds
```

### Text Colors
```typescript
Colors.textPrimary       // #1a1a1a - Primary text
Colors.textSecondary     // #666 - Secondary text
Colors.textTertiary      // #999 - Tertiary text
Colors.textQuaternary    // #030303ff - Dark text
Colors.textMuted         // #6b7280 - Muted text
```

### Border Colors
```typescript
Colors.border            // #e9ecef
Colors.borderLight       // #f0f0f0
Colors.borderDark        // #e0e0e0
Colors.borderInput       // #d1d5db
```

### Overlays & Transparency
```typescript
// Overlays
Colors.overlay           // rgba(0,0,0,0.5)
Colors.overlayDark       // rgba(0,0,0,0.8)
Colors.overlayLight      // rgba(0,0,0,0.3)

// White Transparency
Colors.whiteTransparent70     // rgba(255,255,255,0.7)
Colors.whiteTransparent80     // rgba(255,255,255,0.8)
Colors.whiteTransparent90     // rgba(255,255,255,0.9)
Colors.whiteTransparent20Alpha // rgba(255, 255, 255, 0.2)

// Black Transparency
Colors.blackTransparent       // rgba(0,0,0,0.3)
```

### Gradient Colors
```typescript
Colors.gradientPurple1       // #5865f2
Colors.gradientPurple2       // #8897f5
Colors.gradientEventForm1    // #8B5CF6
Colors.gradientEventForm2    // #6366F1
```

### Role-Specific Colors (Admin)
```typescript
Colors.roleSuper         // #d97706 - Super Admin
Colors.roleSuperBg       // #fef3c7 - Super Admin background
Colors.roleAdmin         // #2563eb - Admin
Colors.roleAdminBg       // #dbeafe - Admin background
Colors.roleUser          // #374151 - User
Colors.roleUserBg        // #f3f4f6 - User background
Colors.roleBanned        // #dc2626 - Banned
Colors.roleBannedBg      // #fee2e2 - Banned background
```

## Usage Examples

### Cards & Containers
```typescript
import { Colors } from '@/constants/colors';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    shadowColor: Colors.black,
  },
});
```

### Text Hierarchy
```typescript
const styles = StyleSheet.create({
  title: {
    color: Colors.textPrimary,      // Main headings
  },
  subtitle: {
    color: Colors.textSecondary,    // Subheadings
  },
  caption: {
    color: Colors.textTertiary,     // Caption text
  },
});
```

### Buttons
```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
    borderColor: Colors.dangerBorder,
  },
  disabledButton: {
    backgroundColor: Colors.gray300,
    opacity: 0.6,
  },
});
```

### Status Indicators
```typescript
const styles = StyleSheet.create({
  successBadge: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  errorBadge: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  warningBadge: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
});
```

### Overlays & Modals
```typescript
const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: Colors.overlay,
  },
  blurBackground: {
    backgroundColor: Colors.whiteTransparent85,
  },
});
```

## Migration Guide

### Step-by-Step Migration

```typescript
// Step 1: Find all color literals
// Search regex: /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g

// Step 2: Import Colors
import { Colors } from '@/constants/colors';

// Step 3: Map common colors
'#fff' → Colors.white
'#000' → Colors.black
'#6366f1' → Colors.primary
'#666' → Colors.textSecondary
'rgba(0,0,0,0.5)' → Colors.overlay

// Step 4: Replace in StyleSheet
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,  // was '#fff'
    borderColor: Colors.gray200,     // was '#e5e7eb'
  },
});

// Step 5: Test on both platforms
npm run android
npm run ios
```

### Common Mappings

| Hardcoded Value | Color Constant | Use Case |
|----------------|----------------|----------|
| `#fff` | `Colors.white` | Backgrounds |
| `#000` | `Colors.black` | Shadows |
| `#1a1a1a` | `Colors.textPrimary` | Main text |
| `#666` | `Colors.textSecondary` | Secondary text |
| `#999` | `Colors.textTertiary` | Tertiary text |
| `#6366f1` | `Colors.primary` | Brand color |
| `#ef4444` | `Colors.danger` | Errors |
| `#10b981` | `Colors.success` | Success |
| `#f59e0b` | `Colors.warning` | Warnings |
| `#e9ecef` | `Colors.border` | Borders |
| `rgba(0,0,0,0.5)` | `Colors.overlay` | Overlays |

### Migration Checklist

- [ ] Import `Colors` from `@/constants/colors`
- [ ] Replace all hex colors with constants
- [ ] Replace all rgba colors with constants
- [ ] Use semantic names (e.g., `textPrimary` not `gray900`)
- [ ] Test on both iOS and Android
- [ ] Verify no `react-native/no-color-literals` ESLint warnings
- [ ] Update documentation if adding new colors

## Platform-Specific Colors

### Using Platform Colors

```typescript
import { Platform } from 'react-native';
import { Colors, getPlatformColor } from '@/constants/colors';

// Method 1: Helper function
const styles = StyleSheet.create({
  container: {
    backgroundColor: getPlatformColor(
      'platformBackground', 
      'platformBackgroundAndroid'
    ),
  },
});

// Method 2: Platform.select
const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' 
      ? Colors.platformBackground 
      : Colors.platformBackgroundAndroid,
  },
});

// Method 3: Platform.select shorthand
const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      backgroundColor: Colors.platformBackground,
      borderColor: Colors.platformBorder,
    },
    android: {
      backgroundColor: Colors.platformBackgroundAndroid,
      borderColor: Colors.platformBorderAndroid,
    },
  }),
});
```

### Available Platform Colors

```typescript
// Background
Colors.platformBackground        // iOS: #f8f9fa
Colors.platformBackgroundAndroid // Android: #e1e1e8ff

// Border
Colors.platformBorder            // iOS: #e9ecef
Colors.platformBorderAndroid     // Android: #e1e2e3ff

// Special
Colors.platformHole              // iOS: #dde4eaff
Colors.platformHoleAndroid       // Android: #e8eff5ff
```

## Best Practices

### Do's ✅

1. **Always use color constants** - Never hardcode colors
2. **Use semantic names** - `Colors.textPrimary` not `Colors.gray900`
3. **Import from constants** - `import { Colors } from '@/constants/colors'`
4. **Test on both platforms** - iOS and Android may differ
5. **Document new colors** - Add to this guide when adding colors

### Don'ts ❌

1. **Never hardcode** - `color: '#666'` ❌
2. **Don't use generic names** - Use semantic names ✅
3. **Don't use named colors** - `backgroundColor: 'white'` ❌
4. **Don't skip testing** - Always test visual changes
5. **Don't ignore warnings** - Fix `react-native/no-color-literals` warnings

## Common Mistakes

### Mistake 1: Using Hex Codes
```typescript
// ❌ Bad
const styles = StyleSheet.create({
  text: {
    color: '#666',
  },
});

// ✅ Good
const styles = StyleSheet.create({
  text: {
    color: Colors.textSecondary,
  },
});
```

### Mistake 2: Using Named Colors
```typescript
// ❌ Bad
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
});

// ✅ Good
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
  },
});
```

### Mistake 3: Inline RGBA
```typescript
// ❌ Bad
<View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

// ✅ Good
const styles = StyleSheet.create({
  overlay: {
    backgroundColor: Colors.overlay,
  },
});
<View style={styles.overlay} />
```

## Adding New Colors

### Process

1. **Add to `colors.ts`**
```typescript
export const Colors = {
  // ...existing colors...
  
  // New color (add descriptive comment)
  accent: "#ff6b6b", // Accent color for highlights
} as const;
```

2. **Document here** - Add to appropriate category
3. **Update examples** - Show usage examples
4. **Test thoroughly** - Verify on both platforms
5. **Update ESLint** - Ensure no warnings

## Related Documentation

- [LINTING_AND_FORMATTING.md](./LINTING_AND_FORMATTING.md) - ESLint rules
- [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Usage patterns
- [LINT_FIXES.md](./LINT_FIXES.md) - Common fixes

---

**Last Updated**: January 2025  
**Version**: 1.0.0
