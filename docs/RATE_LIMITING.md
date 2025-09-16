# 🛡️ Rate Limiting Implementation Guide

Comprehensive rate limiting and abuse protection system for the SPA Operations Dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation](#implementation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Monitoring](#monitoring)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The rate limiting system provides comprehensive protection against abuse, DoS attacks, and suspicious activity through multiple layers of defense:

### **Key Features**
- ✅ **Multiple Algorithms** - Fixed Window, Sliding Window, Token Bucket, Leaky Bucket
- ✅ **Multi-Layer Protection** - API, Authentication, Client-side, Abuse Detection
- ✅ **Environment-Aware** - Different limits for development, production, testing
- ✅ **Role-Based Limits** - Different limits for admin, manager, staff, anonymous users
- ✅ **Real-time Monitoring** - Live status tracking and metrics
- ✅ **Comprehensive Testing** - Unit tests, integration tests, performance tests
- ✅ **Abuse Protection** - Client-side behavior monitoring and blocking

### **Protection Layers**

1. **API Rate Limiting** - Protects Supabase calls and external API requests
2. **Authentication Rate Limiting** - Protects login, signup, password reset
3. **Client-Side Rate Limiting** - Protects against rapid clicking, form spam
4. **Abuse Protection** - Detects and blocks suspicious behavior patterns
5. **System Load Adaptation** - Adjusts limits based on system performance

## 🏗️ Architecture

### **Core Components**

```
src/
├── services/
│   ├── rateLimiterService.ts          # Core rate limiting algorithms
│   ├── rateLimitedSupabaseService.ts  # Rate-limited Supabase wrapper
│   └── abuseProtectionService.ts      # Client-side abuse detection
├── hooks/
│   └── useRateLimit.ts                # React hooks for rate limiting
├── config/
│   └── rateLimiting.ts                # Configuration and policies
├── components/
│   └── RateLimitMonitor.tsx           # Monitoring dashboard
├── context/
│   └── RateLimitedAuthContext.tsx     # Rate-limited authentication
├── utils/
│   └── rateLimitIntegration.ts        # Integration utilities
└── __tests__/
    ├── rateLimiterService.test.ts     # Core service tests
    └── abuseProtectionService.test.ts # Abuse protection tests
```

### **Rate Limiting Algorithms**

#### **Fixed Window**
- **Use Case**: Authentication, data export
- **Behavior**: Resets limit at fixed intervals
- **Pros**: Simple, predictable
- **Cons**: Can have burst traffic at window boundaries

#### **Sliding Window**
- **Use Case**: API calls, real-time subscriptions
- **Behavior**: Continuously sliding time window
- **Pros**: Smooth rate limiting, no burst issues
- **Cons**: More memory intensive

#### **Token Bucket**
- **Use Case**: General API operations, session creation
- **Behavior**: Tokens refill at constant rate
- **Pros**: Allows burst traffic, smooth operation
- **Cons**: Complex implementation

#### **Leaky Bucket**
- **Use Case**: Network traffic, bulk operations
- **Behavior**: Requests leak out at constant rate
- **Pros**: Smooth output, prevents overflow
- **Cons**: Can be slow for burst traffic

## ⚙️ Implementation

### **1. Core Rate Limiter Service**

```typescript
import { RateLimiter, RateLimitAlgorithm } from '../services/rateLimiterService';

// Create a rate limiter
const limiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
  onLimitReached: (key, limit) => {
    console.log(`Rate limit exceeded for ${key}: ${limit}`);
  }
});

// Check rate limit
const result = await limiter.check('user123');
if (!result.allowed) {
  throw new Error(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
}
```

### **2. Rate-Limited Supabase Service**

```typescript
import { RateLimitedSupabaseService } from '../services/rateLimitedSupabaseService';

// Create rate-limited Supabase service
const rateLimitedSupabase = new RateLimitedSupabaseService(supabase);

// Use with automatic rate limiting
const therapists = await rateLimitedSupabase.getTherapists({
  limiterName: 'API_GENERAL'
});

// Create session with rate limiting
const session = await rateLimitedSupabase.createSession(sessionData, {
  limiterName: 'SESSION_CREATE'
});
```

### **3. React Hooks**

```typescript
import { useAuthRateLimit, useApiRateLimit } from '../hooks/useRateLimit';

function LoginForm() {
  const authRateLimit = useAuthRateLimit(email);
  
  const handleLogin = async () => {
    try {
      await authRateLimit.execute(async () => {
        return await supabase.auth.signInWithPassword({
          email,
          password
        });
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        setError(`Too many login attempts. Try again in ${error.retryAfter} seconds.`);
      }
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {!authRateLimit.isAllowed && (
        <div className="error">
          Rate limit exceeded. Try again in {authRateLimit.retryAfter} seconds.
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

### **4. Abuse Protection**

```typescript
import { abuseProtection } from '../services/abuseProtectionService';

// Check if user is blocked
if (abuseProtection.isBlocked()) {
  throw new Error('Access temporarily restricted');
}

// Get abuse statistics
const stats = abuseProtection.getAbuseStats();
console.log(`Total events: ${stats.totalEvents}`);
console.log(`Blocked users: ${stats.blockedCount}`);
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Rate Limiting Configuration
VITE_ENABLE_RATE_LIMITING=true
VITE_BYPASS_RATE_LIMITS_DEV=false
VITE_ENABLE_RATE_LIMIT_MONITORING=true
VITE_ENABLE_RATE_LIMIT_ALERTS=true
VITE_ENABLE_ABUSE_PROTECTION=true
VITE_ENABLE_CLIENT_RATE_LIMITING=true
VITE_ENABLE_SERVER_RATE_LIMITING=true
```

### **Rate Limit Policies**

```typescript
// Development (permissive)
const developmentConfig = {
  auth: {
    login: { windowMs: 900000, maxRequests: 10 }, // 15 min, 10 attempts
    refresh: { windowMs: 60000, maxRequests: 20 }, // 1 min, 20 attempts
  },
  api: {
    general: { windowMs: 60000, maxRequests: 200 }, // 1 min, 200 requests
    sensitive: { windowMs: 60000, maxRequests: 50 }, // 1 min, 50 requests
  },
  business: {
    sessionCreate: { windowMs: 60000, maxRequests: 60 }, // 1 min, 60 sessions
    dataExport: { windowMs: 3600000, maxRequests: 10 }, // 1 hour, 10 exports
  }
};

// Production (restrictive)
const productionConfig = {
  auth: {
    login: { windowMs: 900000, maxRequests: 5 }, // 15 min, 5 attempts
    refresh: { windowMs: 60000, maxRequests: 10 }, // 1 min, 10 attempts
  },
  api: {
    general: { windowMs: 60000, maxRequests: 100 }, // 1 min, 100 requests
    sensitive: { windowMs: 60000, maxRequests: 20 }, // 1 min, 20 requests
  },
  business: {
    sessionCreate: { windowMs: 60000, maxRequests: 30 }, // 1 min, 30 sessions
    dataExport: { windowMs: 3600000, maxRequests: 5 }, // 1 hour, 5 exports
  }
};
```

### **Role-Based Limits**

```typescript
const roleBasedLimits = {
  admin: {
    multiplier: 2.0, // Admins get 2x normal limits
    bypassLimits: ['dataExport'] // Can bypass data export limits
  },
  manager: {
    multiplier: 1.5, // Managers get 1.5x normal limits
    bypassLimits: []
  },
  staff: {
    multiplier: 1.0, // Staff get normal limits
    bypassLimits: []
  },
  anonymous: {
    multiplier: 0.5, // Anonymous users get 0.5x normal limits
    bypassLimits: []
  }
};
```

## 📊 Usage

### **Basic API Protection**

```typescript
import { rateLimitedApiCall } from '../utils/rateLimitIntegration';

// Protect any API call
const data = await rateLimitedApiCall(
  () => supabase.from('therapists').select('*'),
  'API_GENERAL',
  userId
);
```

### **Authentication Protection**

```typescript
import { rateLimitedAuthCall } from '../utils/rateLimitIntegration';

// Protect authentication calls
const result = await rateLimitedAuthCall(
  () => supabase.auth.signInWithPassword({ email, password }),
  email
);
```

### **Component Protection**

```typescript
import { withRateLimit } from '../utils/rateLimitIntegration';

// Protect entire components
const ProtectedComponent = withRateLimit(
  MyComponent,
  'SESSION_CREATE'
);
```

### **Real-time Monitoring**

```typescript
import { RateLimitMonitor } from '../components/RateLimitMonitor';

function AdminDashboard() {
  const [showMonitor, setShowMonitor] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowMonitor(true)}>
        View Rate Limits
      </button>
      
      <RateLimitMonitor
        isOpen={showMonitor}
        onClose={() => setShowMonitor(false)}
        userRole="admin"
      />
    </div>
  );
}
```

## 📈 Monitoring

### **Rate Limit Monitor Dashboard**

The `RateLimitMonitor` component provides real-time monitoring of:

- **Rate Limit Status** - Current status of all rate limiters
- **Abuse Protection Stats** - Events, blocks, bans
- **System Information** - Environment, user role, management access
- **Real-time Updates** - Auto-refresh every 30 seconds

### **Metrics Collection**

```typescript
import { getRateLimitMetrics } from '../utils/rateLimitIntegration';

// Get comprehensive metrics (production only)
const metrics = getRateLimitMetrics();
if (metrics) {
  console.log('Rate limit metrics:', metrics);
  // Send to monitoring service
  sendToMonitoring(metrics);
}
```

### **Logging**

All rate limiting events are logged with structured data:

```typescript
// Rate limit exceeded
logger.warn('Rate limit exceeded', {
  limiter: 'AUTH_LOGIN',
  identifier: 'user@example.com',
  remaining: 0,
  retryAfter: 300
});

// Abuse detected
logger.error('Abuse detected', {
  type: 'rapid_clicking_abuse',
  identifier: 'user123',
  severity: 'medium',
  action: 'warn'
});
```

## 🧪 Testing

### **Unit Tests**

```bash
# Run rate limiting tests
npm test src/services/__tests__/rateLimiterService.test.ts
npm test src/services/__tests__/abuseProtectionService.test.ts
```

### **Test Coverage**

- ✅ **Algorithm Testing** - All rate limiting algorithms
- ✅ **Integration Testing** - Supabase service integration
- ✅ **Performance Testing** - High-volume request handling
- ✅ **Error Handling** - Edge cases and failures
- ✅ **Configuration Testing** - Different environments and roles

### **Test Scenarios**

```typescript
// Test rate limit enforcement
it('should block requests exceeding limit', async () => {
  const limiter = new RateLimiter({
    windowMs: 1000,
    maxRequests: 5,
    algorithm: RateLimitAlgorithm.FIXED_WINDOW
  });
  
  // Exhaust limit
  for (let i = 0; i < 5; i++) {
    await limiter.check('test-user');
  }
  
  // 6th request should be blocked
  const result = await limiter.check('test-user');
  expect(result.allowed).toBe(false);
  expect(result.retryAfter).toBeDefined();
});
```

## 🔍 Troubleshooting

### **Common Issues**

#### **Rate Limits Too Restrictive**
```typescript
// Check current configuration
const config = getCurrentRateLimitConfig();
console.log('Current limits:', config);

// Temporarily increase limits for development
if (process.env.NODE_ENV === 'development') {
  bypassRateLimitForDevelopment();
}
```

#### **Abuse Protection Blocking Legitimate Users**
```typescript
// Check abuse protection status
const stats = abuseProtection.getAbuseStats();
console.log('Abuse stats:', stats);

// Reset protection for specific user
abuseProtection.resetProtection('user123');
```

#### **Rate Limiting Not Working**
```typescript
// Check initialization status
const status = getRateLimitIntegrationStatus();
console.log('Integration status:', status);

// Re-initialize if needed
if (!status.initialized) {
  initializeRateLimitingSystem();
}
```

### **Debug Mode**

Enable debug logging for rate limiting:

```typescript
// Set debug level
logger.setLevel('debug');

// Check rate limiter status
const status = rateLimiterManager.getStatusAll('debug-user');
console.log('Rate limiter status:', status);
```

### **Performance Issues**

Monitor rate limiting performance:

```typescript
// Check for memory leaks
const metrics = getRateLimitMetrics();
if (metrics) {
  console.log('Memory usage:', process.memoryUsage());
  console.log('Rate limiter entries:', Object.keys(metrics.rateLimiters).length);
}
```

## 🚀 Best Practices

### **1. Gradual Rollout**
- Start with permissive limits in development
- Gradually tighten limits based on usage patterns
- Monitor metrics and adjust accordingly

### **2. User Experience**
- Provide clear error messages
- Show retry timers when possible
- Implement graceful degradation

### **3. Monitoring**
- Set up alerts for rate limit violations
- Monitor abuse protection statistics
- Track system performance impact

### **4. Configuration**
- Use environment-specific configurations
- Implement role-based limits
- Regularly review and update limits

### **5. Testing**
- Test all rate limiting scenarios
- Include performance tests
- Test error handling and recovery

---

## 📚 Related Documentation

- [API Documentation](API.md) - Complete API reference
- [Authentication Setup](AUTHENTICATION_SETUP.md) - Auth system configuration
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Monitoring Guide](MONITORING.md) - System monitoring and alerts

---

**Rate limiting is a critical security feature that protects your application from abuse while maintaining a good user experience. Regular monitoring and adjustment of limits ensures optimal protection and performance.** 🛡️✨
