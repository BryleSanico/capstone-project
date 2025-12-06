# Linting and Formatting Guide

## Table of Contents
- [Overview](#overview)
- [Tools](#tools)
- [Configuration Files](#configuration-files)
- [Running Commands](#running-commands)
- [ESLint Rules](#eslint-rules)
- [Prettier Configuration](#prettier-configuration)
- [TypeScript Configuration](#typescript-configuration)
- [Quick Reference](#quick-reference)

## Overview

This project uses ESLint, Prettier, and TypeScript to enforce code quality, consistent formatting, and type safety across the entire React Native codebase.

### Key Benefits
- ✅ **Consistent Code Style**: Enforced across all files and contributors
- ✅ **Early Bug Detection**: Catch errors before runtime
- ✅ **Type Safety**: Full TypeScript strict mode
- ✅ **Best Practices**: React Native and React 19+ patterns
- ✅ **Automated Fixes**: Many issues auto-fixable

## Tools

### ESLint v8.57.0
- **Purpose**: Code quality and error detection
- **Plugins**: TypeScript, React, React Hooks, React Native
- **Config**: Extends `@react-native` community config

### Prettier (Latest)
- **Purpose**: Code formatting
- **Integration**: Works alongside ESLint
- **Files**: `.prettierrc.json` and `.prettierignore`

### TypeScript ~5.8.3
- **Purpose**: Static type checking
- **Mode**: Strict mode enabled
- **Config**: `tsconfig.json`

## Configuration Files

### `.eslintrc.js`

```javascript
// filepath: .eslintrc.js
module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  // ...existing rules...
};
```

### `.prettierrc.json`

```json
{
  "arrowParens": "always",
  "bracketSameLine": false,
  "bracketSpacing": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "endOfLine": "lf"
}
```

### `.prettierignore`

```
# IDE and Config
.vscode
.idea

# Documentation
*.md

# Dependencies
node_modules

# Build outputs
build
dist
android
ios

# Environment
.env*

# Testing
coverage
__tests__

# Config files
*.config.js
.eslintrc.js
```

### `tsconfig.json`

Key compiler options:
- **strict**: `true` - All strict type checks
- **noImplicitAny**: `true` - No implicit any types
- **strictNullChecks**: `true` - Strict null checking
- **noUnusedLocals**: `true` - Flag unused variables
- **noUnusedParameters**: `true` - Flag unused parameters
- **noImplicitReturns**: `true` - Ensure all code paths return

## Running Commands

### ESLint

```bash
# Check for linting errors
npm run lint

# Auto-fix fixable issues
npm run lint:fix

# Target specific files
npx eslint src/screens/LoginScreen.tsx
npx eslint src/screens/LoginScreen.tsx --fix
```

### Prettier

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Format specific file
npx prettier --write src/screens/LoginScreen.tsx
```

### TypeScript

```bash
# Type check entire project
npm run type-check

# Type check with watch mode
npx tsc --noEmit --watch
```

### Combined Workflow

```bash
# Pre-commit check
npm run lint && npm run type-check && npm run format:check

# Fix everything
npm run lint:fix && npm run format && npm run type-check
```

## ESLint Rules

### TypeScript Rules

#### ✅ **Enabled (Errors)**
```typescript
// No unused variables (except prefixed with _)
'@typescript-eslint/no-unused-vars': ['error', { 
  argsIgnorePattern: '^_', 
  varsIgnorePattern: '^_' 
}]

// ❌ Bad
const unused = getValue();

// ✅ Good
const _unused = getValue();
```

#### ⚠️ **Warnings**
```typescript
// Allow 'any' with warning
'@typescript-eslint/no-explicit-any': 'warn'
'@typescript-eslint/no-floating-promises': 'warn'
'@typescript-eslint/no-misused-promises': 'warn'

// ⚠️ Warning
const data: any = response;

// ✅ Better
const data: ResponseType = response;
```

#### Disabled (Gradual Typing) 🔓

```typescript
// OFF for gradual TypeScript adoption
'@typescript-eslint/no-unsafe-assignment': 'off'
'@typescript-eslint/no-unsafe-member-access': 'off'
'@typescript-eslint/no-unsafe-call': 'off'
'@typescript-eslint/no-unsafe-return': 'off'
```

### React Rules

```typescript
// React 19+ - No need to import React
'react/react-in-jsx-scope': 'off'

// PropTypes not needed with TypeScript
'react/prop-types': 'off'

// Hooks must follow rules
'react-hooks/rules-of-hooks': 'error'

// Dependencies warning
'react-hooks/exhaustive-deps': 'warn'
```

### React Native Rules

```typescript
// No inline styles
'react-native/no-inline-styles': 'error'

// ❌ Bad
<View style={{ padding: 10, margin: 5 }} />

// ✅ Good
const styles = StyleSheet.create({
  container: { padding: 10, margin: 5 }
});
<View style={styles.container} />

// No unused styles
'react-native/no-unused-styles': 'error'

// No hardcoded colors (warning)
'react-native/no-color-literals': 'warn'

// ❌ Bad
backgroundColor: '#fff'

// ✅ Good
backgroundColor: Colors.white
```

### General Rules

```typescript
// Console statements (warning)
'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }]

// ✅ Allowed
console.error('Error:', error);
console.warn('Warning:', message);
console.info('Info:', data);
console.debug('Debug:', state);

// ⚠️ Warning - use in __DEV__ blocks
console.log('Debug info');

// Strict equality
'eqeqeq': ['error', 'always']

// ❌ Bad
if (value == null)

// ✅ Good
if (value === null)

// Prefer const
'prefer-const': 'error'

// ❌ Bad
let maxItems = 10;

// ✅ Good
const maxItems = 10;

// Multi-line curly braces
'curly': ['error', 'multi-line']

// ✅ Good (single line)
if (condition) return;

// ✅ Good (multi-line)
if (condition) {
  doSomething();
  doSomethingElse();
}
```

## Prettier Configuration

### Key Settings

```json
{
  "printWidth": 80,          // Max line length
  "tabWidth": 2,             // 2 spaces for indentation
  "semi": true,              // Always use semicolons
  "singleQuote": false,      // Use double quotes
  "trailingComma": "es5",    // Trailing commas where valid
  "bracketSpacing": true,    // Spaces in object literals
  "arrowParens": "always",   // Always parentheses in arrows
  "endOfLine": "lf"          // Unix line endings
}
```

### Formatting Examples

```typescript
// Before
const user={name:"John",age:30,email:"john@example.com"}

// After
const user = { 
  name: "John", 
  age: 30, 
  email: "john@example.com" 
};

// Before
const greet=name=>`Hello ${name}`

// After
const greet = (name) => `Hello ${name}`;
```

## TypeScript Configuration

### Strict Mode Features

```typescript
"strict": true                        // All strict checks
"noImplicitAny": true                 // No implicit any
"strictNullChecks": true              // Strict null checking
"strictFunctionTypes": true           // Strict function types
"strictBindCallApply": true           // Strict bind/call/apply
"strictPropertyInitialization": true  // Strict property init
"noImplicitThis": true                // No implicit this
"alwaysStrict": true                  // Always use strict mode
```

### Code Quality Checks

```typescript
"noUnusedLocals": true               // Flag unused variables
"noUnusedParameters": true           // Flag unused parameters
"noImplicitReturns": true            // All paths must return
"noFallthroughCasesInSwitch": true   // No fallthrough cases
```

### Type Safety Examples

```typescript
// ❌ Error: noImplicitAny
function greet(name) {
  return `Hello ${name}`;
}

// ✅ Good
function greet(name: string): string {
  return `Hello ${name}`;
}

// ❌ Error: strictNullChecks
const user: User = getUserById(id);

// ✅ Good
const user: User | null = getUserById(id);
if (user) {
  console.log(user.name);
}

// ❌ Error: noUnusedLocals
const unused = getValue();

// ✅ Good: Remove or use it
const value = getValue();
console.log(value);
```

## Quick Reference

### Commands

```bash
# Lint
npm run lint              # Check errors
npm run lint:fix          # Auto-fix

# Format
npm run format            # Format all
npm run format:check      # Check only

# Type Check
npm run type-check        # Check types

# All Together
npm run lint:fix && npm run format && npm run type-check

# Reset Metro Cache
npm run reset
```

### File Patterns

```bash
# ESLint Ignores
__tests__/, coverage/, android/, ios/, node_modules/
*.config.js, .eslintrc.js

# Prettier Ignores
*.md, build/, dist/, android/, ios/
*.config.js, .eslintrc.js

# TypeScript Checks
src/**/*.{ts,tsx}
```

### Suppression Comments

```typescript
// Suppress floating promises
// eslint-disable-next-line @typescript-eslint/no-floating-promises
navigation.goBack();

// Suppress any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;

// Suppress color literals (with reason)
// eslint-disable-next-line react-native/no-color-literals
backgroundColor: '#custom', // Brand requirement

// Suppress exhaustive deps
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  // Init logic
}, []);
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json}\"",
    "type-check": "tsc --noEmit"
  }
}
```

## Related Documentation

- [COLOR_SYSTEM.md](./COLOR_SYSTEM.md) - Color constants and theming
- [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Common patterns and examples
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Troubleshooting and CI/CD
- [LINT_FIXES.md](./LINT_FIXES.md) - Common fixes and solutions

---

**Last Updated**: January 2025  
**Version**: 1.0.0
};
```
