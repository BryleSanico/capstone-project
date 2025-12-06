# Code Patterns and Best Practices

## Table of Contents
- [Overview](#overview)
- [Common Patterns](#common-patterns)
- [Component Examples](#component-examples)
- [Service Examples](#service-examples)
- [Best Practices](#best-practices)

## Overview

This guide provides common code patterns, examples, and best practices used throughout the application. Following these patterns ensures consistency and maintainability.

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

### 3. Error Handling

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

### 4. Component Patterns

```typescript
// ❌ Bad: Inline styles and hardcoded colors
<View style={{ padding: 10, margin: 5, backgroundColor: '#fff' }} />

// ✅ Good: StyleSheet with Colors
import { Colors } from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 5,
    backgroundColor: Colors.white,
  },
});
<View style={styles.container} />

// ❌ Bad: Unused variables
const MyComponent = ({ data, unused }) => {
  return <Text>{data}</Text>;
};

// ✅ Good: Prefix with underscore or remove
const MyComponent = ({ data, _metadata }: Props) => {
  return <Text>{data}</Text>;
};
```

## Component Examples

### Complete Button Component

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

### Card Component

```typescript
// filepath: src/components/InfoCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/constants/colors';

interface InfoCardProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress?: () => void;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {onPress && (
        <Icon name="chevron-forward" size={20} color={Colors.gray400} />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryAlpha15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
```

## Service Examples

### User Service (RPC Functions)

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
}
```

### Event Service (RPC Functions)

```typescript
// filepath: src/services/api/eventService.ts
import { supabase } from '../supabase';
import type { Event } from '@/types/event';

export class EventService {
  /**
   * Fetches paginated events with filtering
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
   * Creates a new event
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
}
```

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

## Best Practices

### Component Design

1. **Use TypeScript interfaces** for props
2. **Extract reusable components** when used 3+ times
3. **Keep components focused** - Single responsibility
4. **Use StyleSheet.create** - Never inline styles
5. **Use Colors constants** - Never hardcode colors

### Service Layer

1. **Use static methods** for service functions
2. **Always use try-catch** for error handling
3. **Log errors** with console.error before throwing
4. **Use descriptive RPC names** (e.g., `get_users_paginated`)
5. **Pass parameters as objects** with snake_case keys
6. **Return typed data** using TypeScript interfaces
7. **Handle null/undefined** with fallbacks

### State Management

1. **Batch state updates** with `startTransition`
2. **Use useCallback** for event handlers
3. **Use useMemo** for expensive calculations
4. **Minimize re-renders** - optimize dependencies
5. **Use proper cleanup** in useEffect

### Error Handling

1. **Always handle promises** - No floating promises
2. **Show user-friendly messages** - Use Alert or Toast
3. **Log errors** for debugging
4. **Provide fallbacks** for failed operations
5. **Validate input** before API calls

## Related Documentation

- [LINTING_AND_FORMATTING.md](./LINTING_AND_FORMATTING.md) - Linting rules
- [COLOR_SYSTEM.md](./COLOR_SYSTEM.md) - Color constants
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development setup
- [LINT_FIXES.md](./LINT_FIXES.md) - Common fixes

---

**Last Updated**: January 2025  
**Version**: 1.0.0
