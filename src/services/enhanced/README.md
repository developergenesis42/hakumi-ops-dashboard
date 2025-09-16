# Enhanced Service Layer

This directory contains the enhanced service layer implementation that provides centralized API calls, proper error handling, and request/response caching.

## Key Features

### 1. Centralized API Calls
- **BaseService**: Abstract base class with common functionality
- **ApiClient**: Unified interface for all database operations
- **ServiceFactory**: Centralized service management and instantiation

### 2. Proper Error Handling
- **Custom Error Types**: `ServiceError`, `NetworkError`, `TimeoutError`, `ValidationError`, `NotFoundError`
- **Automatic Retry Logic**: Configurable retry with exponential backoff
- **Error Interceptors**: Centralized error processing and logging

### 3. Request/Response Caching
- **Integrated Caching**: Built-in cache service integration
- **Smart Cache Keys**: Automatic cache key generation
- **Cache Invalidation**: Automatic cache invalidation on mutations

### 4. Performance Monitoring
- **Timing Tracking**: Automatic performance measurement
- **User Action Tracking**: Detailed operation logging
- **Health Checks**: Service health monitoring

## Usage Examples

### Basic Setup

```typescript
import { getServiceFactory, TherapistService, SessionService } from './enhanced';
import { supabase } from '../lib/supabase';

// Initialize service factory
const serviceFactory = getServiceFactory(supabase, {
  enableCaching: true,
  enableRateLimiting: true,
  enableLogging: true,
  defaultTimeout: 10000,
  defaultRetries: 3,
});

// Get service instances
const therapistService = serviceFactory.getService(TherapistService, 'therapist');
const sessionService = serviceFactory.getService(SessionService, 'session');
```

### Using Services

```typescript
// Get all therapists with caching
const therapists = await therapistService.getTherapists();

// Get therapist by ID with custom config
const therapist = await therapistService.getTherapistById('123', {
  timeout: 5000,
  retries: 1,
  cache: { key: 'custom-key', ttl: 300000 }
});

// Create new therapist
const newTherapist = await therapistService.createTherapist({
  name: 'John Doe',
  status: 'available',
  totalEarnings: 0,
  totalSessions: 0,
  expenses: []
});

// Update therapist with error handling
try {
  const updated = await therapistService.updateTherapist('123', {
    status: 'in-session',
    currentSession: { id: 'session-123' }
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

### Error Handling

```typescript
import { ServiceError, NetworkError, ValidationError, NotFoundError } from './enhanced';

try {
  const therapist = await therapistService.getTherapistById('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Therapist not found');
  } else if (error instanceof NetworkError) {
    console.log('Network issue, will retry automatically');
  } else if (error instanceof ValidationError) {
    console.log('Invalid data provided');
  } else if (error instanceof ServiceError) {
    console.log(`Service error: ${error.message} (${error.statusCode})`);
  }
}
```

### Caching

```typescript
// Enable caching (default)
const therapists = await therapistService.getTherapists({
  cache: { key: 'all-therapists', ttl: 300000 } // 5 minutes
});

// Skip cache
const freshTherapists = await therapistService.getTherapists({
  cache: { skipCache: true }
});

// Clear cache
therapistService.invalidateRelatedCache();
```

### Real-time Subscriptions

```typescript
// Subscribe to therapist changes
const unsubscribe = therapistService.subscribeToTherapists((therapists) => {
  console.log('Therapists updated:', therapists);
});

// Unsubscribe when done
unsubscribe();
```

### Batch Operations

```typescript
import { getApiClient } from './enhanced';

const apiClient = getApiClient();

// Execute multiple operations in sequence
const results = await apiClient.batch([
  { operation: 'GET', table: 'therapists' },
  { operation: 'GET', table: 'sessions' },
  { operation: 'POST', table: 'walk_outs', data: walkOutData }
]);
```

## Migration from Legacy Services

### Before (Legacy)
```typescript
import { sessionService } from '../services/sessionService';

// No error handling
const sessions = await sessionService.getTodaySessions();

// Manual error handling
try {
  const session = await sessionService.createSession(sessionData);
} catch (error) {
  console.error('Error:', error);
}
```

### After (Enhanced)
```typescript
import { getService, SessionService } from './enhanced';

const sessionService = getService(SessionService, 'session');

// Automatic error handling with retry
const sessions = await sessionService.getTodaySessions();

// Structured error handling
try {
  const session = await sessionService.createSession(sessionData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof NetworkError) {
    // Handle network errors (automatic retry)
  }
}
```

## Configuration

### Service Factory Configuration
```typescript
const serviceFactory = getServiceFactory(supabase, {
  enableCaching: true,        // Enable/disable caching
  enableRateLimiting: true,   // Enable/disable rate limiting
  enableLogging: true,        // Enable/disable logging
  defaultTimeout: 10000,      // Default timeout in ms
  defaultRetries: 3,          // Default retry count
});
```

### Request Configuration
```typescript
const config: RequestConfig = {
  timeout: 5000,              // Request timeout
  retries: 2,                 // Retry count
  retryDelay: 1000,           // Delay between retries
  cache: {
    key: 'custom-key',        // Cache key
    ttl: 300000,              // Time to live
    skipCache: false          // Skip cache
  },
  skipRateLimit: false,       // Skip rate limiting
  skipLogging: false          // Skip logging
};
```

## Performance Benefits

1. **Reduced API Calls**: Intelligent caching reduces redundant requests
2. **Faster Error Recovery**: Automatic retry with exponential backoff
3. **Better Monitoring**: Detailed performance tracking and logging
4. **Consistent Patterns**: Unified interface across all services
5. **Type Safety**: Full TypeScript support with proper error types

## Health Monitoring

```typescript
// Check service health
const health = await serviceFactory.healthCheck();
console.log('Service Health:', health);

// Get service statistics
const stats = serviceFactory.getServiceStats();
console.log('Service Stats:', stats);

// Get cache statistics
const cacheStats = apiClient.getCacheStats();
console.log('Cache Stats:', cacheStats);
```
