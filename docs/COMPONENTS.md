# 🧩 Component Documentation

Comprehensive documentation for all components in the SPA Operations Dashboard.

## 📋 Table of Contents

- [Loading Components](#loading-components)
- [Expenses Management](#expenses-management)
- [Performance Optimization](#performance-optimization)
- [Configuration Management](#configuration-management)
- [Component Architecture](#component-architecture)

## 🔄 Loading Components

### Unified Loading System

This directory contains a unified loading component that provides comprehensive visual feedback to users during app initialization and data loading.

#### **LoadingScreen Component**

A single, powerful loading component that can handle all loading scenarios in the app.

**Features:**
- **Multiple display modes**: fullscreen, inline, button, spinner
- **Configurable sizes**: sm, md, lg, xl
- **Color themes**: primary, secondary, white, gray, green, blue, red, orange
- **Multi-layered animations**: spinning, pulsing, bouncing, floating
- **Dynamic content**: cycling messages and dots
- **Progress indication**: progress bars and percentage display
- **Status indicators**: connection, sync, authentication status
- **Accessibility**: proper ARIA attributes and keyboard navigation
- **Responsive design**: works on all screen sizes

**Props:**
```typescript
interface LoadingScreenProps {
  mode?: 'fullscreen' | 'inline' | 'button' | 'spinner'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray' | 'green' | 'blue' | 'red' | 'orange'
  message?: string
  showProgress?: boolean
  showDots?: boolean
  showStatus?: boolean
  loading?: boolean
  className?: string
}
```

**Usage Examples:**
```typescript
// Fullscreen loading
<LoadingScreen mode="fullscreen" message="Loading application..." />

// Inline loading
<LoadingScreen mode="inline" size="sm" color="blue" />

// Button loading state
<LoadingScreen mode="button" size="sm" loading={isSubmitting} />

// Spinner only
<LoadingScreen mode="spinner" size="lg" color="green" />
```

**Display Modes:**

1. **Fullscreen** - Covers entire screen with overlay
2. **Inline** - Fits within parent container
3. **Button** - Small spinner for button states
4. **Spinner** - Just the spinner without container

**Animation Types:**
- **Spinning** - Rotating spinner animation
- **Pulsing** - Breathing effect
- **Bouncing** - Up and down motion
- **Floating** - Gentle floating animation

## 💰 Expenses Management

### Comprehensive Expense Tracking

This feature provides comprehensive expense tracking and management for all therapists in the spa operations dashboard.

#### **Core Features**

**Total Expenses Card**
- **Location**: Main Dashboard statistics section
- **Display**: Shows total expenses across all therapists for the current day
- **Styling**: Orange-themed card with hover effects and click functionality
- **Interactive**: Click to open detailed expenses breakdown modal

**Expenses Summary Modal**
- **Access**: Click on the "Total Expenses" card in the dashboard
- **Features**:
  - Total expenses overview with gradient styling
  - Expenses breakdown by category (Coffee, Lunch, Transport, etc.)
  - Expenses breakdown by therapist
  - Percentage calculations for each category and therapist
  - Visual icons for each expense type
  - Responsive design for different screen sizes

**Individual Therapist Expenses**
- **Location**: Each therapist card in the dashboard
- **Features**:
  - Add expenses through the ExpenseModal
  - View recent expenses history
  - Real-time total calculation
  - Predefined expense items with fixed prices

#### **Expense Categories**

**Predefined Categories:**
- **Coffee** - Coffee and beverages
- **Lunch** - Meals and food
- **Transport** - Transportation costs
- **Supplies** - Work supplies and materials
- **Training** - Education and certification
- **Other** - Miscellaneous expenses

**Custom Categories:**
- Users can add custom expense categories
- Flexible pricing for custom items
- Category-based reporting and analysis

#### **Expense Modal Features**

**ExpenseModal Component:**
```typescript
interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  therapist: Therapist
  onExpenseAdded: (expense: Expense) => void
}
```

**Features:**
- **Quick Add** - Predefined expense items with one-click addition
- **Custom Expenses** - Add custom expense with amount and description
- **Category Selection** - Choose from predefined or custom categories
- **Amount Validation** - Numeric input with validation
- **Real-time Calculation** - Immediate total updates
- **History View** - Show recent expenses for the therapist

#### **Expense Tracking Logic**

**Calculation Methods:**
```typescript
// Calculate total expenses for a therapist
const totalExpenses = therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0)

// Calculate total expenses across all therapists
const totalAllExpenses = state.todayRoster.reduce((sum, therapist) => {
  return sum + therapist.expenses.reduce((therapistSum, expense) => therapistSum + expense.amount, 0)
}, 0)
```

**Data Persistence:**
- Expenses are saved to local state immediately
- Synced with Supabase backend
- Persisted across browser sessions
- Real-time updates across multiple users

## ⚡ Performance Optimization

### Code Splitting & Lazy Loading

This guide explains the performance optimizations implemented in the SPA Operations Dashboard.

#### **Implementation Strategy**

**Route-based Splitting:**
```typescript
// Main application routes with lazy loading
const RosterSetup = lazy(() => import('../components/RosterSetup'))
const MainDashboard = lazy(() => import('../components/MainDashboard'))
const ClosingOut = lazy(() => import('../components/ClosingOut'))
const AdminDashboard = lazy(() => import('../components/AdminDashboard'))
```

**Component-based Splitting:**
```typescript
// Large components and modals
const SessionModal = lazy(() => import('../components/SessionModal'))
const WalkOutTable = lazy(() => import('../components/WalkOutTable'))
const UndoWarningModal = lazy(() => import('../components/UndoWarningModal'))
```

**Feature-based Splitting:**
```typescript
// Related components grouped into feature chunks
const AuthComponents = lazy(() => import('../components/auth'))
const SessionComponents = lazy(() => import('../components/session'))
const RosterComponents = lazy(() => import('../components/roster'))
```

#### **Bundle Optimization**

**Tree Shaking Configuration:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['tailwindcss']
        }
      }
    }
  }
})
```

**Asset Optimization:**
- Image compression and WebP format
- Font loading optimization
- CSS purging and minification
- JavaScript minification and compression

#### **Runtime Performance**

**React Optimizations:**
```typescript
// Component memoization
const TherapistCard = React.memo(({ therapist, onStatusChange }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.therapist.id === nextProps.therapist.id &&
         prevProps.therapist.status === nextProps.therapist.status
})

// Expensive calculation memoization
const sessionStats = useMemo(() => {
  return calculateSessionStatistics(sessions)
}, [sessions])

// Event handler memoization
const handleStatusChange = useCallback((therapistId: string, status: TherapistStatus) => {
  updateTherapistStatus(therapistId, status)
}, [])
```

**State Management Optimization:**
```typescript
// Context optimization with separate providers
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch
  }), [state])
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}
```

#### **Performance Monitoring**

**Web Vitals Implementation:**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

const sendToAnalytics = (metric: any) => {
  // Send to analytics service
  console.log('Web Vital:', metric)
}

// Track all Web Vitals
getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**Performance Metrics:**
- **First Contentful Paint (FCP)**: < 2.5s
- **Largest Contentful Paint (LCP)**: < 4.0s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to Interactive (TTI)**: < 5.0s

## ⚙️ Configuration Management

### Centralized Configuration System

This directory contains the centralized configuration management system for the SPA Operations Dashboard.

#### **Files Structure**

```
src/config/
├── environment.ts      # Environment variables and application configuration
├── feature-flags.ts    # Feature flags for A/B testing and gradual rollouts
├── index.ts           # Centralized exports and configuration validation
└── README.md          # Configuration documentation
```

#### **Environment Configuration**

**Environment Variables:**
```bash
# Application Environment
VITE_APP_ENV=development
VITE_APP_NAME=SPA Operations Dashboard
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true

# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_BASE_URL=

# Optional Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_SENTRY_DSN=your_sentry_dsn_here
```

**Configuration Validation:**
```typescript
// environment.ts
export const validateEnvironment = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_APP_ENV'
  ]
  
  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  console.log('✅ Environment validation passed')
}

export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'SPA Operations Dashboard',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    env: import.meta.env.VITE_APP_ENV || 'development'
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  api: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3')
  }
}
```

#### **Feature Flags**

**Feature Flag System:**
```typescript
// feature-flags.ts
export interface FeatureFlags {
  enableLazyLoading: boolean
  enablePerformanceMonitoring: boolean
  enableErrorReporting: boolean
  enableAccessibilityChecks: boolean
  enableAnalytics: boolean
  enableDebugMode: boolean
}

export const getFeatureFlags = (): FeatureFlags => ({
  enableLazyLoading: import.meta.env.VITE_ENABLE_LAZY_LOADING !== 'false',
  enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
  enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  enableAccessibilityChecks: import.meta.env.VITE_ENABLE_ACCESSIBILITY_CHECKS === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: import.meta.env.VITE_DEBUG === 'true'
})

export const useFeatureFlags = () => {
  return getFeatureFlags()
}
```

## 🏗️ Component Architecture

### Component Organization

The application follows a modular component-based architecture with clear separation of concerns:

```
src/components/
├── auth/                 # Authentication components
│   ├── AuthModal.tsx
│   ├── LoginForm.tsx
│   ├── UserMenu.tsx
│   └── index.ts
├── session/             # Session management components
│   ├── SessionModal.tsx
│   ├── ServiceSelection.tsx
│   ├── RoomSelection.tsx
│   ├── ConfirmStep.tsx
│   └── hooks/
├── roster/              # Roster management components
│   ├── RosterSetup.tsx
│   ├── TherapistCard.tsx
│   ├── AddStaffModal.tsx
│   └── RemoveStaffModal.tsx
├── ui/                  # Reusable UI components
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── LoadingSpinner.tsx
├── accessibility/       # Accessibility components
│   ├── AccessibilityChecker.tsx
│   ├── ScreenReader.tsx
│   └── KeyboardNavigation.tsx
└── admin/               # Administrative components
    ├── AdminDashboard.tsx
    └── SystemSettings.tsx
```

### Component Communication Patterns

**Props Down, Events Up:**
```typescript
// Parent component passes data down
<TherapistCard 
  therapist={therapist} 
  onStatusChange={handleStatusChange}
  onExpenseAdd={handleExpenseAdd}
/>

// Child component emits events up
const TherapistCard = ({ therapist, onStatusChange, onExpenseAdd }) => {
  const handleStatusClick = () => {
    onStatusChange(therapist.id, newStatus)
  }
  
  const handleExpenseClick = () => {
    onExpenseAdd(therapist.id)
  }
}
```

**Context for Global State:**
```typescript
// Global state through context
const { state, dispatch } = useApp()

// Component uses global state
const Dashboard = () => {
  const { therapists, sessions, rooms } = state
  
  return (
    <div>
      {therapists.map(therapist => (
        <TherapistCard key={therapist.id} therapist={therapist} />
      ))}
    </div>
  )
}
```

**Custom Hooks for Logic:**
```typescript
// Business logic in custom hooks
const useSessionManagement = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  
  const createSession = useCallback(async (sessionData: CreateSessionRequest) => {
    setLoading(true)
    try {
      const session = await sessionService.createSession(sessionData)
      setSessions(prev => [...prev, session])
      return session
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { sessions, loading, createSession }
}

// Component uses the hook
const SessionModal = () => {
  const { sessions, loading, createSession } = useSessionManagement()
  
  // Component implementation
}
```

### Component Design Principles

**Single Responsibility:**
- Each component has one clear purpose
- Components are focused and cohesive
- Logic is separated from presentation

**Composition over Inheritance:**
- Components are composed together
- Reusable pieces are combined
- Flexible and maintainable structure

**Props Interface Design:**
- Clear, typed interfaces
- Minimal required props
- Sensible defaults
- Optional configuration

**Error Boundaries:**
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

---

## 🎯 Component Best Practices

### **Component Design**
- Keep components small and focused
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow accessibility guidelines

### **Performance**
- Use React.memo for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders
- Use lazy loading for large components

### **Testing**
- Write unit tests for component logic
- Test user interactions and edge cases
- Mock external dependencies
- Ensure accessibility compliance

### **Documentation**
- Document component props and usage
- Provide usage examples
- Explain complex logic and decisions
- Keep documentation up to date

---

**This comprehensive component documentation ensures that developers understand the architecture, usage patterns, and best practices for building and maintaining components in the SPA Operations Dashboard.** 🧩✨
