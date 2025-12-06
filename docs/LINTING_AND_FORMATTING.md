# Linting and Formatting Guide

## Table of Contents
- [Overview](#overview)
- [Tools](#tools)
- [Configuration Files](#configuration-files)
- [Running Commands](#running-commands)
- [ESLint Rules Breakdown](#eslint-rules-breakdown)
- [Prettier Configuration](#prettier-configuration)
- [TypeScript Configuration](#typescript-configuration)
- [Common Patterns](#common-patterns)
- [Color Constants System](#color-constants-system)
- [Code Examples](#code-examples)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Overview

This project uses a comprehensive linting and formatting setup to ensure code quality, consistency, and maintainability across the entire React Native codebase.

### Key Benefits
- ✅ **Consistent Code Style**: Enforced across all files and contributors
- ✅ **Early Bug Detection**: Catch errors before runtime
- ✅ **Type Safety**: Full TypeScript strict mode
- ✅ **Best Practices**: React Native and React 19+ patterns
- ✅ **Automated Fixes**: Many issues auto-fixable
- ✅ **Color System**: Centralized theme management

## Tools

### ESLint
- **Purpose**: Code quality and error detection
- **Version**: 8.57.0
- **Plugins**: TypeScript, React, React Hooks, React Native
- **Config**: Extends `@react-native` community config

### Prettier
- **Purpose**: Code formatting
- **Version**: Latest (via package.json)
- **Integration**: Works alongside ESLint
- **Files**: `.prettierrc.json` and `.prettierignore`

### TypeScript
- **Purpose**: Static type checking
- **Version**: ~5.8.3
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
# IDE and Config directories
.vscode
.idea

# Documentation
*.md

# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
build
dist
android
ios

# Environment files
.env*

# Testing
coverage
.nyc_output
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

# Format specific files
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
# Recommended pre-commit workflow
npm run lint && npm run type-check && npm run format:check

# Or fix everything automatically
npm run lint:fix && npm run format && npm run type-check
```

## ESLint Rules Breakdown

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
const _unused = getValue(); // Intentionally unused
```

#### ⚠️ **Warnings**
```typescript
// Allow 'any' with warning
'@typescript-eslint/no-explicit-any': 'warn'

// ❌ Warning
const data: any = response;

// ✅ Better
const data: ResponseType = response;
```

#### 🔓 **Disabled for Gradual Typing**
```typescript
// These are OFF to allow gradual TypeScript adoption
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

// Dependencies warning (can suppress for init effects)
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

// ⚠️ Warning
console.log('Debug info'); // Use in __DEV__ blocks

// ✅ Allowed
console.error('Error:', error);
console.warn('Warning:', warning);
console.info('Info:', data);
console.debug('Debug:', state);

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

### Examples

```typescript
// Prettier will format this:
const user={name:"John",age:30,email:"john@example.com"}

// To this:
const user = { 
  name: "John", 
  age: 30, 
  email: "john@example.com" 
};

// Arrow functions
const greet=name=>`Hello ${name}`
// Becomes:
const greet = (name) => `Hello ${name}`;

// Arrays and objects
const items=[1,2,3,4,5]
// Becomes:
const items = [1, 2, 3, 4, 5];
```

## TypeScript Configuration

### Strict Mode Features

```typescript
// All strict checks enabled
"strict": true

// Includes:
"noImplicitAny": true
"strictNullChecks": true
"strictFunctionTypes": true
"strictBindCallApply": true
"strictPropertyInitialization": true
"noImplicitThis": true
"alwaysStrict": true
```

### Unused Code Detection

```typescript
"noUnusedLocals": true
"noUnusedParameters": true
"noImplicitReturns": true
"noFallthroughCasesInSwitch": true
```

### Examples

```typescript
// ❌ Error: noImplicitAny
function greet(name) { // Parameter 'name' implicitly has 'any' type
  return `Hello ${name}`;
}

// ✅ Good
function greet(name: string): string {
  return `Hello ${name}`;
}

// ❌ Error: strictNullChecks
const user: User = getUserById(id); // Type 'User | null' is not assignable to type 'User'

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

## Common Patterns

### 1. Async Functions and Promises

```typescript
// ❌ Bad: Floating promise
navigation.navigate('Home');

// ✅ Good: Explicitly void
void navigation.navigate('Home');

// ❌ Bad: Promise in event handler
<Button onPress={async () => await handleSubmit()} />

// ✅ Good: Wrap in void
<Button onPress={() => void handleSubmit()} />

// ❌ Bad: Async without await
const handleClick = async () => {
  doSomething();
};

// ✅ Good: Remove async
const handleClick = () => {
  doSomething();
};
```

### 2. State Management

```typescript
// ❌ Bad: Multiple setState calls
useEffect(() => {
  setState1(value1);
  setState2(value2);
  setState3(value3);
}, [deps]);

// ✅ Good: Use startTransition
import { startTransition } from 'react';

useEffect(() => {
  startTransition(() => {
    setState1(value1);
    setState2(value2);
    setState3(value3);
  });
}, [deps]);

// ✅ Alternative: Consolidate state
const [state, setState] = useState({ 
  val1: '', 
  val2: '', 
  val3: '' 
});

useEffect(() => {
  setState({ val1: value1, val2: value2, val3: value3 });
}, [deps]);
```

### 3. Component Patterns

```typescript
// ❌ Bad: Inline styles
<View style={{ padding: 10, margin: 5, backgroundColor: '#fff' }} />

// ✅ Good: StyleSheet with Colors
const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 5,
    backgroundColor: Colors.white,
  },
});
<View style={styles.container} />

// ❌ Bad: Unused variables
const MyComponent = ({ data, _unused }) => {
  return <Text>{data}</Text>;
};

// ✅ Good: Prefix with underscore or remove
const MyComponent = ({ data, _metadata }: Props) => {
  return <Text>{data}</Text>;
};
```

### 4. Error Handling

```typescript
// ❌ Bad: Unhandled promise
fetchData().then(setData);

// ✅ Good: Proper error handling
fetchData()
  .then(setData)
  .catch((error) => {
    console.error('Failed to fetch:', error);
    Alert.alert('Error', 'Failed to load data');
  });

// ✅ Better: Use async/await with try-catch
const loadData = async () => {
  try {
    const result = await fetchData();
    setData(result);
  } catch (error) {
    console.error('Failed to fetch:', error);
    Alert.alert('Error', 'Failed to load data');
  }
};
```

## Color Constants System

### Why Use Color Constants?

1. **Consistency**: Single source of truth for colors
2. **Maintainability**: Change theme in one place
3. **Type Safety**: Auto-complete and type checking
4. **Platform Awareness**: Handle iOS/Android differences
5. **Accessibility**: Easier to maintain contrast ratios

### Available Color Categories

#### Primary & Brand Colors
```typescript
Colors.primary           // #6366f1
Colors.primaryLight      // #8897f5
Colors.primaryDark       // #4f46e5
Colors.primaryAlpha90    // rgba(99, 102, 241, 0.9)
```

#### Status Colors
```typescript
Colors.success           // #10b981
Colors.successLight      // #f0fdf4
Colors.successBg         // #d1fae5

Colors.danger            // #ef4444
Colors.dangerLight       // #fee2e2
Colors.error             // #ff4757

Colors.warning           // #f59e0b
Colors.warningLight      // #fef3c7

Colors.info              // #2563eb
Colors.infoLight         // #dbeafe
```

#### Gray Scale
```typescript
Colors.gray50            // #f9fafb - Lightest
Colors.gray100           // #f3f4f6
Colors.gray200           // #e5e7eb
// ... up to
Colors.gray900           // #111827 - Darkest
```

#### Semantic Colors
```typescript
// Backgrounds
Colors.background        // #f8f9fa
Colors.backgroundLight   // #fff
Colors.backgroundInput   // #f9fafb

// Text
Colors.textPrimary       // #1a1a1a
Colors.textSecondary     // #666
Colors.textTertiary      // #999

// Borders
Colors.border            // #e9ecef
Colors.borderLight       // #f0f0f0
Colors.borderDark        // #e0e0e0
```

#### Platform-Specific
```typescript
// Use platform-specific colors when needed
Colors.platformBackground        // iOS
Colors.platformBackgroundAndroid // Android

// Helper function
import { getPlatformColor } from '@/constants/colors';

backgroundColor: getPlatformColor(
  'platformBackground', 
  'platformBackgroundAndroid'
),
```

### Usage Examples

```typescript
import { Colors } from '@/constants/colors';

const styles = StyleSheet.create({
  // ❌ Bad: Hardcoded colors
  container: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    shadowColor: '#000',
  },
  
  // ✅ Good: Using constants
  container: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray200,
    shadowColor: Colors.black,
  },
  
  // ✅ Good: Semantic names
  card: {
    backgroundColor: Colors.backgroundLight,
    borderColor: Colors.border,
  },
  
  // ✅ Good: Status colors
  successBadge: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  
  // ✅ Good: Text hierarchy
  title: {
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  caption: {
    color: Colors.textTertiary,
  },
});
```

### Migration Pattern

```typescript
// Step 1: Find all color literals
// Search: /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g

// Step 2: Map to constants
'#fff' → Colors.white
'#000' → Colors.black
'#6366f1' → Colors.primary
'#666' → Colors.textSecondary
'rgba(0,0,0,0.5)' → Colors.overlay

// Step 3: Import Colors
import { Colors } from '@/constants/colors';

// Step 4: Replace literals
backgroundColor: '#fff' → backgroundColor: Colors.white

// Step 5: Test visually
npm run android # or ios
```

## Code Examples

### Complete Component Example

```typescript
// filepath: src/components/CustomButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const handlePress = () => {
    if (!loading && !disabled) {
      void onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  disabled: {
    backgroundColor: Colors.gray300,
    opacity: 0.6,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### API Service Example

```typescript
// filepath: src/services/api/userService.ts
import { supabase } from '../supabase';
import type { User } from '@/types/user';

export class UserService {
  /**
   * Fetches user profile by ID using RPC function
   * @throws {Error} If user not found or network error
   */
  static async getUserById(userId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_by_id', { user_id: userId });

      if (error) throw error;
      if (!data) throw new Error('User not found');

      return data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  /**
   * Updates user profile using RPC function
   * @returns Updated user data
   */
  static async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    const { data, error } = await supabase
      .rpc('update_user_profile', {
        user_id: userId,
        updates: updates,
      });

    if (error) throw error;
    return data;
  }

  /**
   * Fetches paginated users with optional search
   * Example of RPC with pagination
   */
  static async getUsers(
    page: number,
    limit: number,
    searchQuery?: string
  ): Promise<{ users: User[]; hasMore: boolean }> {
    const { data, error } = await supabase
      .rpc('get_users_paginated', {
        p_limit: limit,
        p_offset: page * limit,
        p_search: searchQuery || null,
      });

    if (error) throw error;

    return {
      users: data.users || [],
      hasMore: data.has_more || false,
    };
  }

  /**
   * Updates user role (admin operation)
   * Example of RPC for privileged operations
   */
  static async updateUserRole(
    email: string,
    newRole: 'user' | 'admin' | 'super_admin'
  ): Promise<void> {
    const { error } = await supabase
      .rpc('update_user_role', {
        user_email: email,
        new_role: newRole,
      });

    if (error) throw error;
  }
}
```

### Event Service Example

```typescript
// filepath: src/services/api/eventService.ts
import { supabase } from '../supabase';
import type { Event } from '@/types/event';

export class EventService {
  /**
   * Fetches paginated events with filtering
   * @param page - Page number (0-indexed)
   * @param limit - Number of items per page
   * @param category - Optional category filter
   * @param searchQuery - Optional search query
   */
  static async getEvents(
    page: number,
    limit: number,
    category?: string,
    searchQuery?: string
  ): Promise<{ events: Event[]; hasMore: boolean }> {
    const { data, error } = await supabase
      .rpc('get_events_paginated', {
        p_limit: limit,
        p_offset: page * limit,
        p_category: category === 'All' ? null : category,
        p_search: searchQuery || null,
      });

    if (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }

    return {
      events: data.events || [],
      hasMore: data.has_more || false,
    };
  }

  /**
   * Fetches single event by ID
   */
  static async getEventById(eventId: number): Promise<Event> {
    const { data, error } = await supabase
      .rpc('get_event_by_id', { event_id: eventId });

    if (error) throw error;
    if (!data) throw new Error('Event not found');

    return data;
  }

  /**
   * Creates a new event
   * @returns Created event data
   */
  static async createEvent(
    eventData: Omit<Event, 'id' | 'createdAt'>
  ): Promise<Event> {
    const { data, error } = await supabase
      .rpc('create_event', { event_data: eventData });

    if (error) {
      console.error('Failed to create event:', error);
      throw error;
    }

    return data;
  }

  /**
   * Approves a pending event (admin operation)
   */
  static async approveEvent(eventId: number): Promise<void> {
    const { error } = await supabase
      .rpc('approve_event', { event_id: eventId });

    if (error) {
      console.error('Failed to approve event:', error);
      throw error;
    }
  }

  /**
   * Rejects an event with reason (admin operation)
   */
  static async rejectEvent(
    eventId: number,
    reason: string,
    hardDelete: boolean
  ): Promise<void> {
    const { error } = await supabase
      .rpc('reject_event', {
        event_id: eventId,
        rejection_reason: reason,
        hard_delete: hardDelete,
      });

    if (error) {
      console.error('Failed to reject event:', error);
      throw error;
    }
  }
}
```

### Ticket Service Example

```typescript
// filepath: src/services/api/ticketService.ts
import { supabase } from '../supabase';
import type { Ticket } from '@/types/ticket';

export interface PurchaseRequest {
  eventId: number;
  quantity: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  totalPrice: number;
}

export class TicketService {
  /**
   * Fetches user's tickets
   */
  static async getUserTickets(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .rpc('get_user_tickets');

    if (error) {
      console.error('Failed to fetch tickets:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Purchases tickets for an event
   */
  static async purchaseTickets(
    request: PurchaseRequest
  ): Promise<Ticket> {
    const { data, error } = await supabase
      .rpc('purchase_tickets', {
        p_event_id: request.eventId,
        p_quantity: request.quantity,
        p_event_title: request.eventTitle,
        p_event_date: request.eventDate,
        p_event_time: request.eventTime,
        p_event_location: request.eventLocation,
        p_total_price: request.totalPrice,
      });

    if (error) {
      console.error('Failed to purchase tickets:', error);
      throw error;
    }

    return data;
  }

  /**
   * Fetches single ticket by ID
   */
  static async getTicketById(ticketId: number): Promise<Ticket> {
    const { data, error } = await supabase
      .rpc('get_ticket_by_id', { ticket_id: ticketId });

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');

    return data;
  }
}
```

### Admin Service Example

```typescript
// filepath: src/services/api/adminService.ts
import { supabase } from '../supabase';
import type { AdminStats, AdminLog } from '@/types/admin';

export class AdminService {
  /**
   * Fetches admin dashboard statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    const { data, error } = await supabase
      .rpc('get_admin_stats');

    if (error) {
      console.error('Failed to fetch admin stats:', error);
      throw error;
    }

    return data;
  }

  /**
   * Fetches admin activity logs
   */
  static async getAdminLogs(): Promise<AdminLog[]> {
    const { data, error } = await supabase
      .rpc('get_admin_logs');

    if (error) {
      console.error('Failed to fetch admin logs:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Bans or unbans a user
   */
  static async banUser(
    email: string,
    banUntil: string | null
  ): Promise<void> {
    const { error } = await supabase
      .rpc('ban_user', {
        user_email: email,
        ban_until: banUntil,
      });

    if (error) {
      console.error('Failed to ban/unban user:', error);
      throw error;
    }
  }
}
```

### Key Patterns in RPC Services

1. **Always use try-catch for error handling**
2. **Log errors with console.error before throwing**
3. **Use descriptive RPC function names** (e.g., `get_users_paginated`)
4. **Pass parameters as objects** with snake_case keys
5. **Return typed data** using TypeScript interfaces
6. **Handle null/undefined data** with fallbacks
7. **Document function purpose** with JSDoc comments

### Common RPC Patterns

```typescript
// Pattern 1: Simple fetch
const { data, error } = await supabase.rpc('function_name');
if (error) throw error;
return data;

// Pattern 2: With parameters
const { data, error } = await supabase.rpc('function_name', {
  param1: value1,
  param2: value2,
});

// Pattern 3: Paginated results
const { data, error } = await supabase.rpc('get_items_paginated', {
  p_limit: limit,
  p_offset: page * limit,
});
return {
  items: data.items || [],
  hasMore: data.has_more || false,
};

// Pattern 4: Admin operations (void return)
const { error } = await supabase.rpc('admin_operation', {
  target_id: id,
  reason: reason,
});
if (error) throw error;
```

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@/constants/colors'"

```bash
# Solution 1: Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

# Solution 2: Restart TypeScript server
# In VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Solution 3: Clear Metro cache
npm run reset
```

#### Issue: "Parsing error: Cannot read file 'tsconfig.json'"

```bash
# Solution: Ensure tsconfig.json exists and is valid
npx tsc --showConfig

# Fix: Create/update tsconfig.json
npm run type-check
```

#### Issue: ESLint not finding plugins

```bash
# Solution: Reinstall dependencies
rm -rf node_modules
npm install

# Or clear npm cache
npm cache clean --force
npm install
```

#### Issue: Prettier conflicts with ESLint

```bash
# Solution: Run in order
npm run lint:fix     # Fix ESLint issues first
npm run format       # Then format with Prettier

# Or use together
npm run lint:fix && npm run format
```

### Editor Integration

#### VS Code Settings

```json
// .vscode/settings.json
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

#### Recommended Extensions

- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode
- **TypeScript**: Built-in
- **React Native Tools**: msjsdiag.vscode-react-native

## CI/CD Integration

### Pre-commit Hook (Husky)

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

### GitHub Actions

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run format:check
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
    "validate": "npm run lint && npm run type-check && npm run format:check"
  }
}
```

## Best Practices Summary

### Do's ✅

1. **Always use color constants** from `@/constants/colors`
2. **Run linters before committing** code
3. **Use TypeScript strictly** - no `any` unless absolutely necessary
4. **Handle promises properly** - use `void` or `.catch()`
5. **Follow React 19 patterns** - No need to import React
6. **Use StyleSheet.create** - Never inline styles
7. **Prefix unused variables** with underscore `_`
8. **Use semantic color names** - `Colors.textPrimary` not `Colors.gray900`
9. **Batch state updates** - Use `startTransition` when needed
10. **Document suppressions** - Add comments when disabling rules

### Don'ts ❌

1. **Never hardcode colors** - `'#fff'` → `Colors.white`
2. **Don't use `console.log`** - Use `console.error/warn/info/debug`
3. **Don't ignore type errors** - Fix or properly annotate
4. **Don't use `any` casually** - Use proper types
5. **Don't ignore ESLint warnings** - They catch real issues
6. **Don't commit unformatted code** - Run `npm run format`
7. **Don't shadow variables** - Rename to avoid confusion
8. **Don't use inline styles** - Use StyleSheet
9. **Don't leave unused imports** - Clean up regularly
10. **Don't disable rules without reason** - Document why

## Quick Reference

### Commands Cheat Sheet

```bash
# Lint
npm run lint              # Check for errors
npm run lint:fix          # Auto-fix issues

# Format
npm run format            # Format all files
npm run format:check      # Check formatting

# Type Check
npm run type-check        # Check types

# All Together
npm run lint:fix && npm run format && npm run type-check

# Reset Cache
npm run reset             # Clear Metro cache
```

### File Patterns

```bash
# Ignored by ESLint
__tests__/, coverage/, android/, ios/, node_modules/
*.config.js, .eslintrc.js

# Ignored by Prettier
*.md, build/, dist/, android/, ios/
*.config.js, .eslintrc.js

# Checked by TypeScript
src/**/*.{ts,tsx}, *.ts, *.tsx
```

### Color Migration Checklist

- [ ] Import `Colors` from `@/constants/colors`
- [ ] Replace all hex colors with constants
- [ ] Replace all rgba colors with constants
- [ ] Use semantic names (textPrimary vs gray900)
- [ ] Test on both iOS and Android
- [ ] Verify no `react-native/no-color-literals` warnings
- [ ] Update documentation if adding new colors

## Resources

### Documentation
- [ESLint Docs](https://eslint.org/docs/latest/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Prettier Docs](https://prettier.io/docs/en/index.html)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

### Internal Docs
- [LINT_FIXES.md](./LINT_FIXES.md) - Common fixes and solutions
- [README.md](../README.md) - Project overview

### Support
- **Issues**: Check GitHub issues or create new one
- **Questions**: Ask in team chat or create discussion
- **Improvements**: Submit PR with proposed changes

---

**Last Updated**: January 2025  
**Maintained By**: Development Team  
**Version**: 1.0.0
