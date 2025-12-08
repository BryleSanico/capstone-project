# Logger Utility Documentation

## Overview

The `logger` utility is a centralized logging system that provides environment-aware logging capabilities throughout the application. It follows the **Single Responsibility Principle (SRP)** and ensures that logs are only output during development, with complete suppression in production builds.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Production Logging](#production-logging)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

---

## Features

✅ **Environment-Aware**: Automatically detects `__DEV__` flag  
✅ **Production-Safe**: Zero logs in production builds  
✅ **Type-Safe**: Uses TypeScript with `unknown[]` for rest parameters  
✅ **Multiple Log Levels**: `info`, `warn`, `error`  
✅ **Clean API**: Simple, intuitive method names  
✅ **Performance**: No overhead in production  
✅ **Security**: Prevents sensitive data leakage  

---

## Installation

The logger is already set up in the project. Simply import it:

```typescript
import { logger } from '../utils/system/logger';
```

---

## Usage

### Basic Examples

```typescript
import { logger } from '../utils/system/logger';

// Informational logs (development only)
logger.info('[ComponentName] Component mounted');
logger.info('[ServiceName] Fetching data...', { userId: 123 });

// Warning logs (development only)
logger.warn('[ServiceName] API request failed, retrying...', error);

// Error logs (development only)
logger.error('[ServiceName] Critical error occurred:', error);
```

### With Multiple Arguments

```typescript
// All arguments are type-safe
logger.info('User action:', { action: 'click', target: 'button' }, Date.now());
logger.error('Failed to save:', error, { userId, eventId });
```

### Context Tagging

Use prefixes to identify the source of logs:

```typescript
// Services
logger.info('[AuthService] User logged in:', userId);

// Stores
logger.info('[NetworkStore] Connection status changed:', isConnected);

// Hooks
logger.info('[useUserDataSync] Hydrating cache...');

// Components
logger.info('[EventCard] Event data:', eventData);
```

---

## API Reference

### `logger.info(message: string, ...args: unknown[]): void`

Logs informational messages. Only outputs in development mode.

**Use Cases:**
- Component lifecycle events
- Data fetching operations
- Cache operations
- Successful operations

**Example:**
```typescript
logger.info('[SQLite] Saved 10 events to cache');
```

---

### `logger.warn(message: string, ...args: unknown[]): void`

Logs warning messages. Only outputs in development mode.

**Use Cases:**
- Recoverable errors
- Deprecation notices
- Fallback behavior
- Performance warnings

**Example:**
```typescript
logger.warn('[API] Request timed out, falling back to cache');
```

---

### `logger.error(message: string, ...args: unknown[]): void`

Logs error messages. Only outputs in development mode.

**Use Cases:**
- Exceptions and errors
- Failed operations
- Validation failures
- Critical issues

**Example:**
```typescript
logger.error('[Auth] Login failed:', error);
```

---

### `logger.log(level: LogLevel, message: string, ...args: unknown[]): void`

Generic logging method with level specification. Only outputs in development mode.

**Example:**
```typescript
logger.log('info', '[Service] Operation complete');
logger.log('error', '[Service] Operation failed', error);
```

---

## Best Practices

### ✅ DO

```typescript
// 1. Use descriptive context tags
logger.info('[UserService] Fetching user profile...');

// 2. Include relevant data
logger.error('[Payment] Transaction failed:', { orderId, amount, error });

// 3. Use appropriate log levels
logger.info('User logged in'); // Success
logger.warn('API response delayed'); // Warning
logger.error('Database connection failed'); // Error

// 4. Log at key points
async function fetchData() {
  logger.info('[API] Starting fetch...');
  const data = await api.get('/data');
  logger.info('[API] Fetch complete:', data.length, 'items');
  return data;
}
```

### ❌ DON'T

```typescript
// 1. Don't log sensitive data
logger.info('User password:', password); // ❌ NEVER DO THIS

// 2. Don't use console.* directly
console.log('Debug info'); // ❌ Use logger.info() instead

// 3. Don't log in loops (performance)
items.forEach(item => {
  logger.info('Processing:', item); // ❌ Too verbose
});

// 4. Don't wrap logger in __DEV__ checks
if (__DEV__) {
  logger.info('Message'); // ❌ Logger already checks __DEV__
}
```

---

## Production Logging

### Why Logs Are Suppressed

In production, console logging:
- Exposes sensitive data
- Impacts performance
- Creates unnecessary overhead
- Can reveal implementation details

### Recommended Production Solutions

For production error tracking and monitoring, use dedicated services:

#### 1. **Sentry** (Recommended)

```typescript
import * as Sentry from '@sentry/react-native';

// Setup
Sentry.init({
  dsn: 'your-dsn-here',
  environment: __DEV__ ? 'development' : 'production',
});

// Usage
try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  logger.error('[Service] Error occurred:', error); // Dev only
}
```

#### 2. **Firebase Crashlytics**

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Usage
try {
  // Your code
} catch (error) {
  crashlytics().recordError(error);
  logger.error('[Service] Error occurred:', error); // Dev only
}
```

#### 3. **Custom Analytics**

```typescript
// Create a production-safe logger wrapper
import analytics from '@react-native-firebase/analytics';

export const trackError = (message: string, error: unknown) => {
  if (__DEV__) {
    logger.error(message, error);
  } else {
    analytics().logEvent('error', {
      message,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
```

---

## Migration Guide

### Before (Using console.*)

```typescript
// Old code
if (__DEV__) {
  console.log('[Service] Fetching data...');
}

try {
  const data = await api.fetch();
  if (__DEV__) {
    console.info('[Service] Success:', data);
  }
} catch (error) {
  console.error('[Service] Failed:', error);
}
```

### After (Using logger)

```typescript
// New code
logger.info('[Service] Fetching data...');

try {
  const data = await api.fetch();
  logger.info('[Service] Success:', data);
} catch (error) {
  logger.error('[Service] Failed:', error);
}
```

### Quick Find & Replace

Use these regex patterns in your IDE:

**Pattern 1: Remove `if (__DEV__)` wrappers**
```regex
Find:    if \(__DEV__\) \{\s*console\.(log|info|warn|error)\(
Replace: logger.$1(
```

**Pattern 2: Replace console methods**
```regex
Find:    console\.(log|info|warn|error)\(
Replace: logger.$1(
```

---

## Troubleshooting

### Problem: Logs not appearing in development

**Solution:**
```typescript
// Check if __DEV__ is properly set
logger.info('Is dev mode?', __DEV__); // Should log true

// If false, check your Metro bundler configuration
```

### Problem: TypeScript errors with logger arguments

**Solution:**
```typescript
// If you get type errors, explicitly type your data
const data: unknown = someValue;
logger.info('Data:', data);

// Or use type assertion
logger.info('Data:', someValue as unknown);
```

### Problem: Still seeing console.* in code

**Solution:**
```bash
# Search for remaining console statements
grep -r "console\." src/ --exclude-dir=node_modules

# Add ESLint rule to prevent console usage
// .eslintrc.js
rules: {
  'no-console': 'error'
}
```

---

## Architecture

### Class Structure

```typescript
class Logger {
  private isDevMode: boolean; // Set once in constructor
  
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  log(level: LogLevel, message: string, ...args: unknown[]): void;
}

export const logger = new Logger(); // Singleton instance
```

### Design Principles

- **Single Responsibility**: Only handles logging
- **Open/Closed**: Open for extension (add methods), closed for modification
- **Dependency Inversion**: No dependencies on concrete implementations
- **Interface Segregation**: Simple, focused interface

---

## Performance Impact

### Development
- ✅ Minimal overhead from function calls
- ✅ Native console.* performance

### Production
- ✅ **Zero overhead** - early returns prevent all operations
- ✅ No string concatenation
- ✅ No object serialization
- ✅ Dead code elimination by bundler

---

## Security Considerations

### What NOT to Log

❌ Passwords or credentials  
❌ Authentication tokens  
❌ Credit card information  
❌ Personal identifiable information (PII)  
❌ API keys or secrets  
❌ Full user objects (may contain sensitive fields)  

### Safe to Log

✅ User IDs (non-sensitive identifiers)  
✅ Event names  
✅ Component lifecycle events  
✅ Navigation actions  
✅ Non-sensitive error messages  
✅ Performance metrics  

---

## Examples by Module

### Services

```typescript
// filepath: src/services/api/eventService.ts
import { logger } from '../../utils/system/logger';

export async function fetchEvents(page: number) {
  logger.info(`[EventService] Fetching page ${page}...`);
  
  try {
    const data = await api.get(`/events?page=${page}`);
    logger.info(`[EventService] Fetched ${data.length} events`);
    return data;
  } catch (error) {
    logger.error('[EventService] Fetch failed:', error);
    throw error;
  }
}
```

### Stores (Zustand)

```typescript
// filepath: src/stores/auth-store.ts
import { logger } from '../utils/system/logger';

export const useAuth = create<AuthState>((set) => ({
  initialize: () => {
    logger.info('[AuthStore] Initializing...');
    
    supabase.auth.onAuthStateChange((event, session) => {
      logger.info('[AuthStore] State changed:', event);
      set({ session, user: session?.user });
    });
  },
}));
```

### Hooks

```typescript
// filepath: src/hooks/useUserDataSync.tsx
import { logger } from '../../utils/system/logger';

export function useUserDataSync() {
  useEffect(() => {
    logger.info('[useUserDataSync] Starting sync...');
    
    syncData().then(() => {
      logger.info('[useUserDataSync] Sync complete');
    });
  }, []);
}
```

### Components

```typescript
// filepath: src/screens/HomeScreen.tsx
import { logger } from '../utils/system/logger';

export default function HomeScreen() {
  useEffect(() => {
    logger.info('[HomeScreen] Mounted');
    return () => logger.info('[HomeScreen] Unmounted');
  }, []);
}
```

---

## Testing

### Unit Tests

```typescript
import { logger } from '../utils/system/logger';

// Mock logger in tests
jest.mock('../utils/system/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

test('should log info message', () => {
  myFunction();
  expect(logger.info).toHaveBeenCalledWith('[Test] Message');
});
```

---

## FAQs

**Q: Can I use logger in production?**  
A: Yes! It's safe because all logs are automatically suppressed.

**Q: Should I remove logger calls before releasing?**  
A: No! Keep them for future debugging. They have zero cost in production.

**Q: Can I add custom log levels?**  
A: Yes, extend the Logger class with new methods if needed.

**Q: How do I debug production issues?**  
A: Use Sentry, Firebase Crashlytics, or similar services for production monitoring.

**Q: Does logger work with React Native Debugger?**  
A: Yes, all logs appear in React Native Debugger in development mode.

---

## Related Documentation

- [Sentry React Native Setup](https://docs.sentry.io/platforms/react-native/)
- [Firebase Crashlytics](https://rnfirebase.io/crashlytics/usage)
- [React Native Debugging](https://reactnative.dev/docs/debugging)

---

## Changelog

### v1.0.0 (2025)
- Initial implementation
- Support for info, warn, error levels
- Production log suppression
- TypeScript support with unknown[] rest parameters
- Comprehensive documentation

---

## License

Internal project utility - follows project license.

---

## Support

For issues or questions, contact the development team or create an issue in the project repository.
