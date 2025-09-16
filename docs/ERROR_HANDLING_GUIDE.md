# Error Handling Guide

This guide outlines the standardized error handling patterns used throughout the SPA Operations Dashboard application.

## Overview

The application uses a centralized error handling system that provides:
- Consistent error types and categorization
- Automatic retry mechanisms for transient errors
- Centralized logging and monitoring
- User-friendly error messages
- Graceful degradation

## Error Types

### AppError Class

All errors should be wrapped in the `AppError` class which provides:

```typescript
import { AppError, ErrorCode, ErrorSeverity } from '../types/errors';

// Create specific error types
const networkError = AppError.networkError('Connection failed');
const validationError = AppError.validationError('Invalid input');
const notFoundError = AppError.notFoundError('User');
const databaseError = AppError.databaseError('Query failed');
```

### Error Codes

- `NETWORK_ERROR` - Network connectivity issues
- `TIMEOUT_ERROR` - Request timeouts
- `AUTH_ERROR` - Authentication failures
- `VALIDATION_ERROR` - Input validation errors
- `DATABASE_ERROR` - Database operation failures
- `BUSINESS_ERROR` - Business logic violations
- `NOT_FOUND` - Resource not found
- `EXTERNAL_SERVICE_ERROR` - Third-party service failures

### Error Severity

- `LOW` - Minor issues that don't affect functionality
- `MEDIUM` - Issues that may affect some features
- `HIGH` - Issues that significantly impact functionality
- `CRITICAL` - Issues that break core functionality

## Service Layer Patterns

### Using Service Wrappers

```typescript
import { createServiceMethod, withErrorHandling, withRetry } from '../utils/serviceWrapper';

// Basic error handling
const safeMethod = withErrorHandling(
  async (data: any) => {
    // Your service logic
  },
  {
    context: 'UserService',
    errorContext: { component: 'UserService', action: 'createUser' }
  }
);

// With retry logic
const retryMethod = withRetry(
  async (id: string) => {
    // Your service logic
  },
  {
    context: 'UserService',
    retryable: true,
    retryOptions: { maxAttempts: 3, baseDelay: 1000 }
  }
);

// Complete service method with all features
const createUser = createServiceMethod(
  async (userData: UserData) => {
    // Your service logic
  },
  {
    methodName: 'createUser',
    context: 'UserService',
    validator: (data) => data.email ? true : 'Email is required',
    timeout: 10000,
    enableRetry: true,
    retryable: true,
    errorContext: { component: 'UserService', action: 'createUser' }
  }
);
```

### Direct Error Service Usage

```typescript
import { errorService } from '../services/errorService';

// Handle errors directly
try {
  const result = await someOperation();
} catch (error) {
  errorService.handleError(error, 'OperationContext', {
    context: { component: 'MyComponent', action: 'performOperation' }
  });
}

// Async operations with automatic error handling
const result = await errorService.handleAsync(
  () => someAsyncOperation(),
  'OperationContext'
);

// With retry logic
const result = await errorService.executeWithRetry(
  () => someAsyncOperation(),
  'OperationContext',
  { maxAttempts: 3, baseDelay: 1000 }
);
```

## Hook Patterns

### Using Enhanced Error Handler Hook

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyComponent() {
  const { handleError, handleAsyncError, handleWithRetry } = useErrorHandler();

  const handleClick = async () => {
    // Basic error handling
    await handleAsyncError(
      () => performOperation(),
      'MyComponent.handleClick'
    );

    // With retry
    await handleWithRetry(
      () => performOperation(),
      'MyComponent.handleClick',
      { maxAttempts: 3, baseDelay: 1000 }
    );
  };

  const handleErrorClick = () => {
    try {
      // Some operation that might fail
    } catch (error) {
      handleError(error, 'MyComponent.handleErrorClick', {
        context: { component: 'MyComponent', action: 'handleErrorClick' }
      });
    }
  };
}
```

## Component Patterns

### Error Boundaries

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorFallback />}
      onError={(error, errorInfo) => {
        // Custom error handling
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Component Error Handling

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyComponent() {
  const { handleError, createSafeAsync } = useErrorHandler();
  const [loading, setLoading] = useState(false);

  // Create safe async functions
  const safeLoadData = createSafeAsync(
    () => loadData(),
    'MyComponent.loadData',
    { fallbackMessage: 'Failed to load data' }
  );

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await submitData(data);
    } catch (error) {
      handleError(error, 'MyComponent.handleSubmit', {
        context: { component: 'MyComponent', action: 'handleSubmit' }
      });
    } finally {
      setLoading(false);
    }
  };
}
```

## Best Practices

### 1. Always Use AppError for Business Logic Errors

```typescript
// ❌ Don't do this
throw new Error('User not found');

// ✅ Do this
throw AppError.notFoundError('User', { component: 'UserService' });
```

### 2. Provide Context for Errors

```typescript
// ❌ Don't do this
throw AppError.databaseError('Query failed');

// ✅ Do this
throw AppError.databaseError('Query failed', {
  component: 'UserService',
  action: 'findUser',
  userId: user.id
});
```

### 3. Use Appropriate Error Severity

```typescript
// Low severity - minor UI issues
throw new AppError('Theme not found', ErrorCode.NOT_FOUND, ErrorSeverity.LOW);

// High severity - critical functionality
throw new AppError('Database connection lost', ErrorCode.DATABASE_ERROR, ErrorSeverity.HIGH);
```

### 4. Implement Retry Logic for Transient Errors

```typescript
// For network or database errors that might be temporary
const result = await errorService.executeWithRetry(
  () => fetchData(),
  'DataService.fetchData',
  { maxAttempts: 3, baseDelay: 1000 }
);
```

### 5. Graceful Degradation

```typescript
// Provide fallback values when possible
const data = await errorService.handleAsync(
  () => fetchData(),
  'DataService.fetchData',
  { fallbackValue: [] }
);
```

### 6. User-Friendly Error Messages

```typescript
// The error service automatically provides user-friendly messages
// But you can customize them:
handleError(error, 'UserService.createUser', {
  fallbackMessage: 'Unable to create user account. Please try again.'
});
```

## Migration Guide

### Step 1: Replace Direct Error Throwing

```typescript
// Before
throw new Error('Something went wrong');

// After
throw AppError.businessError('Something went wrong', {
  component: 'MyService',
  action: 'doSomething'
});
```

### Step 2: Replace Try-Catch Blocks

```typescript
// Before
try {
  const result = await someOperation();
} catch (error) {
  console.error('Error:', error);
  alert('Something went wrong');
}

// After
const result = await errorService.handleAsync(
  () => someOperation(),
  'MyComponent.someOperation',
  { fallbackMessage: 'Something went wrong' }
);
```

### Step 3: Add Retry Logic

```typescript
// Before
const result = await fetchData();

// After
const result = await errorService.executeWithRetry(
  () => fetchData(),
  'DataService.fetchData',
  { maxAttempts: 3, baseDelay: 1000 }
);
```

### Step 4: Use Service Wrappers

```typescript
// Before
export const userService = {
  async createUser(userData: UserData) {
    try {
      // Implementation
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
};

// After
export const userService = {
  createUser: createServiceMethod(
    async (userData: UserData) => {
      // Implementation
    },
    {
      methodName: 'createUser',
      context: 'UserService',
      validator: validateUserData,
      enableRetry: true
    }
  )
};
```

## Testing Error Handling

```typescript
import { AppError, ErrorCode } from '../types/errors';

describe('Error Handling', () => {
  it('should create proper AppError', () => {
    const error = AppError.validationError('Invalid input');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it('should handle errors gracefully', async () => {
    const result = await errorService.handleAsync(
      () => Promise.reject(new Error('Test error')),
      'TestContext'
    );
    expect(result).toBeNull();
  });
});
```

## Monitoring and Debugging

The error handling system automatically:
- Logs errors with appropriate severity levels
- Tracks errors for monitoring services
- Provides detailed context for debugging
- Shows user-friendly messages

Check the browser console and monitoring dashboard for error details and patterns.
