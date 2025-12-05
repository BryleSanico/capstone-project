# ESLint Error Fixes Guide

## Common Issues and Solutions

### 1. Floating Promises

**Error**: `Promises must be awaited, end with a call to .catch, ...`

**Fix**: Add `void` operator for intentionally ignored promises:

```typescript
// Before
navigation.navigate('SomeScreen');

// After
void navigation.navigate('SomeScreen');
```

### 2. Promise-returning function in event handlers

**Error**: `Promise-returning function provided to attribute where a void return was expected`

**Fix**: Wrap async functions:

```typescript
// Before
<Button onPress={async () => await handleSubmit()} />

// After  
<Button onPress={() => void handleSubmit()} />
// OR
const handlePress = () => {
  void handleSubmit();
};
<Button onPress={handlePress} />
```

### 3. Console Statements

**Error**: `Unexpected console statement`

**Fix**: Replace `console.log` with `console.error`, `console.warn`, `console.info`, or `console.debug`:

```typescript
// Development only
if (__DEV__) {
  console.log('Debug info');
}

// Or use error/warn/info/debug (allowed by config)
console.error('Error:', error);
console.warn('Warning:', warning);
console.info('Info:', data);
console.debug('Debug:', state);
```

### 4. Color Literals ⚠️ **IMPORTANT**

**Error**: `Color literal: { backgroundColor: '#fff' }` or `react-native/no-color-literals`

**Fix**: Use color constants from `@/constants/colors`:

```typescript
// Before
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    shadowColor: '#000',
  },
  text: {
    color: '#1a1a1a',
  },
});

// After
import { Colors } from '../constants/colors';
// Or with path alias: import { Colors } from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    shadowColor: Colors.black,
  },
  text: {
    color: Colors.textPrimary,
  },
});
```

### 5. Equality Operators

**Error**: `Expected '!==' and instead saw '!='`

**Fix**: Use strict equality:

```typescript
// Before
if (value != null)

// After
if (value !== null)
```

### 6. Unused Styles

**Error**: `Unused style detected`

**Fix**: Remove unused style definitions or use them.

### 7. Async Function Without Await

**Error**: `Async arrow function has no 'await' expression`

**Fix**: Remove `async` keyword if no await is used:

```typescript
// Before
const handleClear = async () => {
  clearData();
};

// After
const handleClear = () => {
  clearData();
};
```

### 8. Inline Styles

**Error**: `Inline style: style={{...}}`

**Fix**: Move styles to StyleSheet:

```typescript
// Before
<View style={{ padding: 10, margin: 5 }} />

// After
const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 5,
  },
});
<View style={styles.container} />
```

### 9. Variable Shadowing

**Error**: `'name' is already declared in the upper scope`

**Fix**: Rename the variable to avoid shadowing:

```typescript
// Before
const user = getUser();
users.map(user => user.name); // shadows outer 'user'

// After
const user = getUser();
users.map(currentUser => currentUser.name);
```

### 10. Missing Curly Braces

**Error**: `Expected { after 'if' condition`

**Fix**: Always use curly braces for multi-line conditions:

```typescript
// Before
if (condition) return;

// After (if multi-line)
if (condition) {
  return;
}

// Single line is OK per config
if (condition) return;
```

### 11. Prefer Const

**Error**: `'variable' is never reassigned. Use 'const' instead`

**Fix**: Use `const` for values that don't change:

```typescript
// Before
let maxItems = 10;

// After
const maxItems = 10;
```

### 12. Unused Variables

**Error**: `'variable' is defined but never used`

**Fix**: Remove unused variables or prefix with underscore if required by interface:

```typescript
// Remove if truly unused
// const unused = getValue();

// Or prefix with _ if required parameter
const handleEvent = (_event: Event, data: Data) => {
  console.info('Data:', data);
};
```

### 13. Cascading setState in useEffect

**Error**: Multiple setState calls causing re-renders

**Fix**: Batch state updates or use `startTransition`:

```typescript
// Before
useEffect(() => {
  setState1(value1);
  setState2(value2);
  setState3(value3);
}, [deps]);

// After - Using startTransition
useEffect(() => {
  startTransition(() => {
    setState1(value1);
    setState2(value2);
    setState3(value3);
  });
}, [deps]);

// Or consolidate into single state object
const [state, setState] = useState({ val1: '', val2: '', val3: '' });
useEffect(() => {
  setState({ val1: value1, val2: value2, val3: value3 });
}, [deps]);
```

## Color Constants Comprehensive Guide

### Available Color Categories

#### Primary & Brand Colors
```typescript
Colors.primary           // #6366f1 - Main brand color
Colors.primaryLight      // #8897f5 - Lighter variant
Colors.primaryDark       // #4f46e5 - Darker variant
Colors.primaryAlpha90    // rgba(99, 102, 241, 0.9) - 90% opacity
Colors.primaryAlpha15    // rgba(99, 102, 241, 0.15) - 15% opacity
```

#### Status Colors
```typescript
// Success
Colors.success           // #10b981
Colors.successLight      // #f0fdf4
Colors.successDark       // #16a34a
Colors.successBg         // #d1fae5

// Error/Danger
Colors.danger            // #ef4444
Colors.dangerLight       // #fee2e2
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

#### Gray Scale
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

#### Background Colors
```typescript
Colors.background        // #f8f9fa - Main background
Colors.backgroundLight   // #fff
Colors.backgroundInput   // #f9fafb
Colors.backgroundCard    // #fefefeff
```

#### Text Colors
```typescript
Colors.textPrimary       // #1a1a1a - Primary text
Colors.textSecondary     // #666 - Secondary text
Colors.textTertiary      // #999 - Tertiary text
Colors.textQuaternary    // #030303ff - Dark text
Colors.textMuted         // #6b7280 - Muted text
```

#### Border Colors
```typescript
Colors.border            // #e9ecef
Colors.borderLight       // #f0f0f0
Colors.borderDark        // #e0e0e0
Colors.borderInput       // #d1d5db
```

#### Transparent & Overlays
```typescript
Colors.transparent       // transparent
Colors.overlay           // rgba(0,0,0,0.5)
Colors.overlayDark       // rgba(0,0,0,0.8)
Colors.overlayLight      // rgba(0,0,0,0.3)

// White transparency variants
Colors.whiteTransparent       // rgba(255,255,255,0.2)
Colors.whiteTransparent70     // rgba(255,255,255,0.7)
Colors.whiteTransparent80     // rgba(255,255,255,0.8)
Colors.whiteTransparent90     // rgba(255,255,255,0.9)
Colors.whiteTransparent20Alpha // rgba(255, 255, 255, 0.2)

// Black transparency
Colors.blackTransparent       // rgba(0,0,0,0.3)
```

#### Platform-Specific Colors
```typescript
Colors.platformBackground        // #f8f9fa
Colors.platformBackgroundAndroid // #e1e1e8ff
Colors.platformBorderAndroid     // #e1e2e3ff
Colors.platformHole              // iOS: #dde4eaff
Colors.platformHoleAndroid       // Android: #e8eff5ff
```

#### Role-Specific Colors (Admin)
```typescript
Colors.roleSuper         // #d97706
Colors.roleSuperBg       // #fef3c7
Colors.roleAdmin         // #2563eb
Colors.roleAdminBg       // #dbeafe
Colors.roleUser          // #374151
Colors.roleUserBg        // #f3f4f6
Colors.roleBanned        // #dc2626
Colors.roleBannedBg      // #fee2e2
```

#### Gradient Colors
```typescript
Colors.gradientPurple1       // #5865f2
Colors.gradientPurple2       // #8897f5
Colors.gradientEventForm1    // #8B5CF6
Colors.gradientEventForm2    // #6366F1
```

### Platform-Specific Color Helper

```typescript
import { Colors, getPlatformColor } from '@/constants/colors';

// Automatically select color based on platform
backgroundColor: getPlatformColor('platformBackground', 'platformBackgroundAndroid'),

// Or using Platform.select
import { Platform } from 'react-native';

backgroundColor: Platform.OS === 'ios' 
  ? Colors.gray50 
  : Colors.platformBackgroundAndroid,
```

### Common Color Mapping Examples

```typescript
// Cards & Containers
container: {
  backgroundColor: Colors.white,
  borderColor: Colors.border,
  shadowColor: Colors.black,
}

// Text Hierarchy
title: {
  color: Colors.textPrimary,      // Main headings
}
subtitle: {
  color: Colors.textSecondary,    // Subheadings
}
caption: {
  color: Colors.textTertiary,     // Caption/meta text
}

// Buttons
primaryButton: {
  backgroundColor: Colors.primary,
  shadowColor: Colors.primary,
}
dangerButton: {
  backgroundColor: Colors.danger,
  borderColor: Colors.dangerBorder,
}

// Status Indicators
successBadge: {
  backgroundColor: Colors.successLight,
  borderColor: Colors.success,
}
errorBadge: {
  backgroundColor: Colors.dangerLight,
  borderColor: Colors.danger,
}

// Overlays & Modals
modalOverlay: {
  backgroundColor: Colors.overlay,
}
blurBackground: {
  backgroundColor: Colors.whiteTransparent85,
}
```

### Migration Pattern

When migrating existing code:

1. **Identify all color literals** (hex codes, rgba, named colors)
2. **Find matching color constant** from `Colors` object
3. **Import Colors** at the top of file
4. **Replace literals** with constants
5. **Test visual appearance** to ensure consistency

```typescript
// Step 1: Before migration
const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  text: { color: '#1a1a1a' },
  border: { borderColor: '#e5e7eb' },
});

// Step 2: After migration
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.white },
  text: { color: Colors.textPrimary },
  border: { borderColor: Colors.gray200 },
});
```

## Quick Fix Commands

```bash
# Auto-fix what can be fixed
npm run lint:fix

# Check remaining issues
npm run lint

# Type check
npm run type-check

# Format code
npm run format

# Check formatting without changes
npm run format:check

# Run all checks
npm run lint && npm run type-check && npm run format:check
```

## Temporary Suppressions

For legacy code or third-party issues, you can suppress specific lines:

```typescript
// eslint-disable-next-line @typescript-eslint/no-floating-promises
navigation.goBack();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;

// eslint-disable-next-line react-native/no-color-literals
backgroundColor: '#custom-color', // Specific design requirement

// eslint-disable-next-line react-native/no-inline-styles
<View style={{ padding: customValue }} /> // Dynamic value required

// For entire useEffect with known setState pattern
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  // Initialization logic with multiple setState calls
}, []);
```

**Note**: Use suppressions sparingly and document why they're needed.

## ESLint Configuration Overview

The project uses a comprehensive ESLint setup with:

- **TypeScript**: Strict type checking with relaxed gradual typing rules
- **React**: React 19+ with hooks support
- **React Native**: Platform-specific rules for styles and colors
- **Code Quality**: Enforces strict equality, const preference, and curly braces

### Key Rules:
- ✅ Strict equality (`===`, `!==`)
- ✅ No inline styles
- ✅ No unused styles or variables
- ✅ Color constants from `@/constants/colors`
- ✅ `void` operator for intentionally ignored promises
- ⚠️ Floating promises and console.log are warnings
- ⚠️ Any type usage is a warning (not error)
- ⚠️ Exhaustive deps for hooks is a warning (can be suppressed for initialization)

### Allowed Console Methods

```typescript
console.error('Error:', error);    // ✅ Allowed
console.warn('Warning:', message);  // ✅ Allowed
console.info('Info:', data);        // ✅ Allowed
console.debug('Debug:', state);     // ✅ Allowed
console.log('Debug:', value);       // ⚠️ Warning (use in __DEV__ only)
```

## Best Practices

1. **Always use color constants** - Never hardcode colors
2. **Import from one location** - `import { Colors } from '@/constants/colors'`
3. **Use semantic names** - Use `Colors.textPrimary` instead of `Colors.gray900`
4. **Platform-aware colors** - Use platform-specific colors when needed
5. **Batch state updates** - Use `startTransition` for multiple setState calls
6. **Consistent patterns** - Follow existing code patterns in the project
7. **Document suppressions** - Add comments explaining why rules are suppressed
8. **Test after changes** - Ensure visual consistency after color migrations

## Common Color Migration Mistakes

❌ **Don't do this:**
```typescript
color: '#666'  // Generic gray
```

✅ **Do this:**
```typescript
color: Colors.textSecondary  // Semantic name
```

❌ **Don't do this:**
```typescript
backgroundColor: 'white'  // Named color
```

✅ **Do this:**
```typescript
backgroundColor: Colors.white  // Constant
```

❌ **Don't do this:**
```typescript
shadowColor: '#000000'  // Hex with full opacity
```

✅ **Do this:**
```typescript
shadowColor: Colors.black  // Predefined constant
```
