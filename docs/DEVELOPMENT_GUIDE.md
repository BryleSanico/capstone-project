# Development Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Editor Setup](#editor-setup)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)
- [Testing](#testing)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- React Native CLI
- iOS/Android development environment

### Installation

```bash
# Install dependencies
npm install

# iOS specific
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on device/simulator
npm run android
npm run ios
```

## Editor Setup

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Recommended Extensions

Install these VS Code extensions:

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **React Native Tools** (msjsdiag.vscode-react-native)
- **TypeScript** (Built-in)

### Keyboard Shortcuts

```
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
Cmd/Ctrl + Shift + P → "ESLint: Fix all auto-fixable Problems"
Cmd/Ctrl + Shift + P → "Format Document"
```

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@/constants/colors'"

**Solution 1: Check tsconfig.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Solution 2: Restart TypeScript Server**
```
VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

**Solution 3: Clear Metro Cache**
```bash
npm run reset
```

---

#### Issue: "Parsing error: Cannot read file 'tsconfig.json'"

**Solution: Verify tsconfig.json exists**
```bash
# Check configuration
npx tsc --showConfig

# Run type check
npm run type-check
```

---

#### Issue: ESLint not finding plugins

**Solution: Reinstall dependencies**
```bash
# Remove node_modules
rm -rf node_modules

# Clear cache and reinstall
npm cache clean --force
npm install
```

---

#### Issue: Prettier conflicts with ESLint

**Solution: Run in order**
```bash
# Fix ESLint issues first
npm run lint:fix

# Then format with Prettier
npm run format

# Or combine
npm run lint:fix && npm run format
```

---

#### Issue: Metro bundler errors

**Solution: Clear all caches**
```bash
# Clear Metro cache
npm run reset

# Clear watchman cache (macOS/Linux)
watchman watch-del-all

# Clear iOS build
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Clear Android build
cd android && ./gradlew clean && cd ..
```

---

#### Issue: TypeScript errors after update

**Solution: Update types and restart**
```bash
# Update TypeScript
npm install typescript@latest --save-dev

# Update types
npm install @types/react@latest @types/react-native@latest --save-dev

# Restart TS server
# VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Platform-Specific Issues

#### iOS

```bash
# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Clean build
cd ios && xcodebuild clean && cd ..
```

#### Android

```bash
# Clear gradle cache
cd android && ./gradlew clean && cd ..

# Clear build folder
rm -rf android/build android/app/build

# Reset ADB
adb kill-server && adb start-server
```

## CI/CD Integration

### Pre-commit Hook (Husky)

**Installation:**
```bash
npm install --save-dev husky

# Initialize husky
npx husky install

# Add to package.json
npm pkg set scripts.prepare="husky install"
```

**Create pre-commit hook:**
```bash
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

**File: `.husky/pre-commit`**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run format:check
```

### GitHub Actions

**File: `.github/workflows/lint.yml`**
```yaml
name: Lint and Type Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Check Prettier formatting
        run: npm run format:check

      - name: Run tests
        run: npm test
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run type-check && npm run format:check",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Pre-push Validation

**File: `.husky/pre-push`**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run validate
npm run test
```

## Testing

### Jest Configuration

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/MyComponent.test.tsx
```

### Test Coverage

View coverage report:
```bash
# Generate coverage
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

## Best Practices

### Development Workflow

1. **Before coding:**
```bash
git pull origin develop
npm install
```

2. **While coding:**
```bash
# Run linter in watch mode (terminal 1)
npm run lint -- --watch

# Run type checker in watch mode (terminal 2)
npm run type-check -- --watch

# Run app (terminal 3)
npm start
```

3. **Before committing:**
```bash
npm run validate
npm run test
git add .
git commit -m "feat: description"
```

### Code Quality Checklist

- [ ] No ESLint errors or warnings
- [ ] No TypeScript errors
- [ ] Code formatted with Prettier
- [ ] All tests passing
- [ ] No hardcoded colors (use `Colors` constants)
- [ ] No inline styles
- [ ] Proper error handling
- [ ] JSDoc comments for public APIs

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new login screen
fix: resolve navigation bug
docs: update README
style: format code with prettier
refactor: simplify user service
test: add tests for login
chore: update dependencies
```

## Useful Commands

```bash
# Development
npm start                 # Start Metro bundler
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run reset            # Clear Metro cache

# Quality Checks
npm run lint             # Check linting
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run type-check       # Check types
npm run validate         # Run all checks

# Testing
npm test                 # Run tests
npm run test:coverage    # Generate coverage

# Maintenance
npm run clean            # Clean build artifacts
npm outdated             # Check for updates
npm update               # Update dependencies
```

## Related Documentation

- [LINTING_AND_FORMATTING.md](./LINTING_AND_FORMATTING.md) - Linting setup
- [COLOR_SYSTEM.md](./COLOR_SYSTEM.md) - Color constants
- [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Code patterns
- [LINT_FIXES.md](./LINT_FIXES.md) - Common fixes

---

**Last Updated**: January 2025  
**Version**: 1.0.0
