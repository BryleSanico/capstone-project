# Linting and Formatting Guide

## Table of Contents
- [Overview](#overview)
- [Tools](#tools)
- [Configuration Files](#configuration-files)
- [Running Commands](#running-commands)
- [Pre-Commit Hooks (Husky)](#pre-commit-hooks-husky)
- [lint-staged Configuration](#lint-staged-configuration)
- [ESLint Rules](#eslint-rules)
- [Prettier Configuration](#prettier-configuration)
- [TypeScript Configuration](#typescript-configuration)
- [Quick Reference](#quick-reference)

## Overview

This project uses ESLint, Prettier, TypeScript, Husky, and lint-staged to enforce code quality, consistent formatting, and type safety across the entire React Native codebase.

### Key Benefits
- ✅ **Consistent Code Style**: Enforced across all files and contributors
- ✅ **Early Bug Detection**: Catch errors before runtime
- ✅ **Type Safety**: Full TypeScript strict mode
- ✅ **Best Practices**: React Native and React 19+ patterns
- ✅ **Automated Fixes**: Many issues auto-fixable
- ✅ **Pre-Commit Validation**: Prevents bad code from being committed
- ✅ **Fast**: Only checks/fixes staged files

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

### Husky v8.0.0
- **Purpose**: Git hooks management
- **Hook**: Pre-commit validation
- **Config**: `.husky/pre-commit`

### lint-staged v15.2.0
- **Purpose**: Run tasks on staged files only
- **Integration**: Works with Husky
- **Config**: `lint-staged` field in `package.json`

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

## Pre-Commit Hooks (Husky)

### Overview

Husky manages Git hooks to enforce code quality before commits are allowed. This ensures that only properly formatted, linted, and type-safe code enters the repository.

### Installation

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky (creates .husky folder)
npx husky install

# Add prepare script (auto-installs hooks after npm install)
npm pkg set scripts.prepare="husky install"
```

### Configuration

**File: `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged for auto-fixing staged files
echo "🎯 Running lint-staged (auto-fix for staged files)..."
npx lint-staged
if [ $? -ne 0 ]; then
  echo "❌ Lint-staged failed. Some issues could not be auto-fixed."
  echo "💡 Try running: npm run lint:fix && npm run format"
  exit 1
fi

# Run TypeScript type check on entire project
echo "📘 Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed."
  echo "💡 Fix type errors and try again."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
```

### Making Hook Executable

```bash
# Make the hook executable
chmod +x .husky/pre-commit

# Verify it's executable
ls -la .husky/pre-commit
# Should show: -rwxr-xr-x
```

### How It Works

1. **You stage files**: `git add src/MyComponent.tsx`
2. **You commit**: `git commit -m "feat: add component"`
3. **Husky intercepts**: Runs `.husky/pre-commit` script
4. **lint-staged runs**: Auto-fixes staged files
5. **Type-check runs**: Validates entire project
6. **Commit proceeds**: Only if all checks pass

### Bypassing Hooks

**⚠️ Use sparingly - only for emergencies**

```bash
# Skip pre-commit checks
git commit --no-verify -m "emergency fix"

# Or disable Husky temporarily
HUSKY=0 git commit -m "skip hooks"

# Disable for entire session
export HUSKY=0
git commit -m "first commit"
git commit -m "second commit"
unset HUSKY
```

## lint-staged Configuration

### Overview

lint-staged runs linters and formatters **only on staged files**, making pre-commit checks extremely fast. It automatically fixes issues and adds fixed files back to the commit.

### Configuration

**File: `package.json`**

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### What It Does

#### For `.ts`, `.tsx`, `.js`, `.jsx` files:
1. Runs `eslint --fix` to auto-fix linting issues
2. Runs `prettier --write` to format code
3. Automatically adds fixed files back to staging

#### For `.json`, `.md` files:
1. Runs `prettier --write` to format code
2. Automatically adds fixed files back to staging

### Example Workflow

```bash
# 1. Create/modify file with issues
echo "const x=1;const y=2" > src/test.ts

# 2. Stage the file
git add src/test.ts

# 3. Commit (lint-staged runs automatically)
git commit -m "test: add test file"

# Output:
# 🔍 Running pre-commit checks...
# 🎯 Running lint-staged (auto-fix for staged files)...
# ✔ Preparing lint-staged...
# ✔ Running tasks for staged files...
#   ✔ *.{js,jsx,ts,tsx} — 2 files
#     ✔ eslint --fix
#     ✔ prettier --write
# ✔ Applying modifications from tasks...
# ✔ Cleaning up temporary files...
# 📘 Running TypeScript type check...
# ✅ All pre-commit checks passed!

# File is automatically formatted and committed!
```

### Manual Execution

```bash
# Run lint-staged manually
npx lint-staged

# Run on all staged files
git add .
npx lint-staged
```

### Benefits

✅ **Fast**: Only processes staged files (not entire codebase)  
✅ **Automatic**: Fixes issues without manual intervention  
✅ **Safe**: Won't modify unstaged changes  
✅ **Smart**: Auto-adds fixed files to commit  
✅ **Configurable**: Easy to add/remove tasks

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

# Husky & lint-staged
npx lint-staged           # Run lint-staged manually
git commit                # Triggers pre-commit hook
git commit --no-verify    # Skip pre-commit hook (not recommended)

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

## CI Integration

All linting and formatting checks are automatically run in the CI workflow (`.github/workflows/ci.yml`) on every push and pull request.  
This ensures code quality and consistency for all contributions.

- **Lint:** `npm run lint`
- **Format Check:** `npm run format:check`
- **Type Check:** `npm run type-check`

See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for more on CI/CD.

## Related Documentation

- [COLOR_SYSTEM.md](./COLOR_SYSTEM.md) - Color constants and theming
- [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Common patterns and examples
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Troubleshooting and CI/CD
- [LINT_FIXES.md](./LINT_FIXES.md) - Common fixes and solutions

---

**Last Updated**: January 2025  
**Version**: 1.1.0 - Added Husky and lint-staged
