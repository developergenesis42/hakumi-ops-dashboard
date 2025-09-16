# API Documentation

This document provides comprehensive API documentation for the SPA Operations Dashboard, including services, hooks, data structures, and integration patterns.

## 📋 Table of Contents

- [Services](#services)
- [Custom Hooks](#custom-hooks)
- [Data Structures](#data-structures)
- [Context Providers](#context-providers)
- [Utilities](#utilities)
- [Integration Patterns](#integration-patterns)

## 🔧 Services

### Authentication Service

**Location**: `src/services/authService.ts`

Handles all authentication-related operations with Supabase Auth.

```typescript
interface AuthService {
  // Authentication methods
  signIn(email: string, password: string): Promise<AuthResponse>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  
  // Session management
  refreshSession(): Promise<Session | null>
  isAuthenticated(): boolean
  
  // User profile management
  updateProfile(updates: ProfileUpdate): Promise<User>
  getProfile(): Promise<UserProfile | null>
}
```

**Usage Example**:
```typescript
import { authService } from '../services/authService'

// Sign in user
const response = await authService.signIn('admin@spa.com', 'password')
if (response.user) {
  console.log('User authenticated:', response.user.email)
}

// Check authentication status
if (authService.isAuthenticated()) {
  console.log('User is logged in')
}
```

### Session Service

**Location**: `src/services/sessionService.ts`

Manages spa session lifecycle including creation, updates, and completion.

```typescript
interface SessionService {
  // Session CRUD operations
  createSession(session: CreateSessionRequest): Promise<Session>
  updateSession(session: Session): Promise<Session>
  deleteSession(sessionId: string): Promise<void>
  getSession(sessionId: string): Promise<Session | null>
  getAllSessions(): Promise<Session[]>
  
  // Session state management
  startSession(sessionId: string): Promise<Session>
  completeSession(sessionId: string): Promise<Session>
  cancelSession(sessionId: string, reason: string): Promise<Session>
  
  // Session queries
  getActiveSessions(): Promise<Session[]>
  getSessionsByTherapist(therapistId: string): Promise<Session[]>
  getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]>
}
```

**Usage Example**:
```typescript
import { sessionService } from '../services/sessionService'

// Create a new session
const newSession = await sessionService.createSession({
  therapistIds: ['therapist-1'],
  serviceId: 'service-1',
  roomId: 'room-1',
  discount: 0,
  startTime: new Date()
})

// Complete a session
await sessionService.completeSession(newSession.id)
```

### Therapist Service

**Location**: `src/services/therapistService.ts`

Manages therapist data and roster operations.

```typescript
interface TherapistService {
  // Therapist management
  getTherapists(): Promise<Therapist[]>
  getTherapist(id: string): Promise<Therapist | null>
  updateTherapist(therapist: Therapist): Promise<Therapist>
  
  // Roster operations
  getTodayRoster(): Promise<Therapist[]>
  addToRoster(therapistId: string): Promise<void>
  removeFromRoster(therapistId: string): Promise<void>
  clearRoster(): Promise<void>
  
  // Status management
  updateTherapistStatus(therapistId: string, status: TherapistStatus): Promise<void>
  getAvailableTherapists(): Promise<Therapist[]>
}
```

### Walkout Service

**Location**: `src/services/walkoutService.ts`

Handles walk-out and no-show tracking.

```typescript
interface WalkoutService {
  // Walk-out management
  createWalkOut(walkOut: CreateWalkOutRequest): Promise<WalkOut>
  getWalkOuts(): Promise<WalkOut[]>
  getWalkOutsByDate(date: Date): Promise<WalkOut[]>
  
  // Statistics
  getWalkOutStats(): Promise<WalkOutStats>
  getWalkOutReasons(): Promise<WalkOutReason[]>
}
```

### Expense Service

**Location**: `src/services/expenseService.ts`

Manages therapist expense tracking.

```typescript
interface ExpenseService {
  // Expense CRUD operations
  createExpense(expense: CreateExpenseRequest): Promise<Expense>
  updateExpense(expense: Expense): Promise<Expense>
  deleteExpense(expenseId: string): Promise<void>
  
  // Expense queries
  getExpensesByTherapist(therapistId: string): Promise<Expense[]>
  getTodayExpenses(): Promise<Expense[]>
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>
}
```

## 🎣 Custom Hooks

### Authentication Hooks

**Location**: `src/hooks/useAuth.ts`

```typescript
interface UseAuthReturn {
  // Authentication state
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
  
  // Authentication actions
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Usage
const { isAuthenticated, user, signIn, signOut } = useAuth()
```

### Application State Hook

**Location**: `src/hooks/useApp.ts`

```typescript
interface UseAppReturn {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  
  // State selectors
  currentPhase: AppPhase
  therapists: Therapist[]
  sessions: Session[]
  rooms: Room[]
  services: Service[]
}

// Usage
const { state, dispatch } = useApp()
```

### Dashboard Statistics Hook

**Location**: `src/hooks/useDashboardStats.ts`

```typescript
interface DashboardStats {
  totalSlips: number
  totalRevenue: number
  totalPayouts: number
  totalDiscounts: number
  totalExpenses: number
  shopRevenue: number
  walkOutCount: number
}

// Usage
const stats = useDashboardStats()
```

### Validation Hook

**Location**: `src/hooks/useValidation.ts`

```typescript
interface UseFieldValidationReturn {
  value: string
  error: string | null
  isValid: boolean
  setValue: (value: string) => void
  validate: () => ValidationResult
  reset: () => void
}

// Usage
const walkOutValidation = useFieldValidation('', ValidationRules.walkOutCount)
```

### Undo Functionality Hook

**Location**: `src/hooks/useUndoWithWarning.ts`

```typescript
interface UseUndoWithWarningReturn {
  canUndo: boolean
  lastActionModifiesDatabase: boolean
  lastActionDescription: string
  handleUndo: () => void
  isWarningModalOpen: boolean
  handleCloseWarning: () => void
  handleConfirmUndo: () => void
}

// Usage
const { canUndo, handleUndo, isWarningModalOpen } = useUndoWithWarning()
```

### Session Modal Hook

**Location**: `src/hooks/useSessionModal.ts`

```typescript
interface UseSessionModalReturn {
  // Modal state
  currentStep: SessionStep
  isSubmitting: boolean
  
  // Form state
  selectedServiceCategory: string | null
  selectedService: Service | null
  selectedRoom: Room | null
  selectedTherapist2: Therapist | null
  discount: number
  
  // Actions
  setSelectedServiceCategory: (category: string) => void
  setSelectedService: (service: Service) => void
  setSelectedRoom: (room: Room) => void
  setSelectedTherapist2: (therapist: Therapist) => void
  setDiscount: (discount: number) => void
  handleNext: () => void
  handleBack: () => void
  handleSubmit: () => Promise<void>
  
  // Computed values
  availableRooms: Room[]
  availableTherapists: Therapist[]
}
```

## 📊 Data Structures

### Core Types

**Location**: `src/types/index.ts`

```typescript
// Therapist interface
interface Therapist {
  id: string
  name: string
  status: 'available' | 'in-session' | 'departed'
  totalEarnings: number
  expenses: Expense[]
  checkInTime?: Date
  checkOutTime?: Date
  workingHours?: number
}

// Session interface
interface Session {
  id: string
  therapistIds: string[]
  service: Service
  roomId: string
  totalPrice: number
  discount: number
  status: 'active' | 'completed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
}

// Service interface
interface Service {
  id: string
  name: string
  category: 'single' | 'double' | 'couple'
  duration: number
  price: number
  ladyPayout: number
  shopRevenue: number
}

// Room interface
interface Room {
  id: string
  name: string
  type: 'shower' | 'vip' | 'jacuzzi'
  status: 'available' | 'occupied'
  capacity: number
}

// Walk-out interface
interface WalkOut {
  id: string
  sessionId?: string
  therapistIds: string[]
  service?: Service | null
  totalAmount: number
  timestamp: Date
  count: number
  reason: WalkOutReason
}

// Expense interface
interface Expense {
  id: string
  therapistId: string
  amount: number
  description: string
  category: string
  timestamp: Date
}
```

### Application State

```typescript
interface AppState {
  currentPhase: 'roster-setup' | 'daily-operations' | 'closing-out' | 'admin-dashboard' | 'todos'
  therapists: Therapist[]
  todayRoster: Therapist[]
  sessions: Session[]
  rooms: Room[]
  services: Service[]
  walkOuts: WalkOut[]
  dailyStats: DailyStats
}

interface AppAction {
  type: string
  payload?: any
}
```

### Validation Rules

```typescript
interface ValidationRules {
  required: (value: string) => ValidationResult
  minLength: (min: number) => (value: string) => ValidationResult
  maxLength: (max: number) => (value: string) => ValidationResult
  numeric: (value: string) => ValidationResult
  positiveNumber: (value: string) => ValidationResult
  walkOutCount: (value: string) => ValidationResult
}

interface ValidationResult {
  isValid: boolean
  error?: string
}
```

## 🎭 Context Providers

### App Context

**Location**: `src/context/AppContext.tsx`

Provides global application state management.

```typescript
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

// Usage
const { state, dispatch } = useApp()
```

### Authentication Context

**Location**: `src/context/AuthContext.tsx`

Manages authentication state and user information.

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Usage
const { isAuthenticated, user, signIn, signOut } = useAuth()
```

### Supabase Data Context

**Location**: `src/context/SupabaseDataContext.tsx`

Handles Supabase data synchronization and caching.

```typescript
interface SupabaseDataContextType {
  therapists: Therapist[]
  rooms: Room[]
  services: Service[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

// Usage
const { therapists, rooms, services, loading } = useSupabaseData()
```

## 🛠️ Utilities

### Helper Functions

**Location**: `src/utils/helpers.ts`

```typescript
// Currency formatting
formatCurrency(amount: number): string

// Payout calculations
calculatePayout(earnings: number, expenses: number): number

// ID generation
generateId(): string

// Date formatting
formatDate(date: Date): string
formatTime(date: Date): string

// Data validation
validateEmail(email: string): boolean
validatePhone(phone: string): boolean
```

### Validation Utilities

**Location**: `src/utils/validation.ts`

```typescript
// Validation rules factory
createValidationRule(rule: ValidationRule): (value: string) => ValidationResult

// Common validation patterns
ValidationRules = {
  required: (value: string) => ValidationResult,
  email: (value: string) => ValidationResult,
  numeric: (value: string) => ValidationResult,
  walkOutCount: (value: string) => ValidationResult,
  // ... more rules
}
```

### Working Hours Utilities

**Location**: `src/utils/workingHours.ts`

```typescript
// Working hours calculations
calculateWorkingHours(checkIn: Date, checkOut?: Date): number
formatWorkingHours(hours: number): string

// Attendance tracking
getTodayAttendance(): AttendanceRecord[]
exportAttendanceData(): string
```

## 🔄 Integration Patterns

### Service Integration

```typescript
// Example: Integrating multiple services
const useSessionManagement = () => {
  const { dispatch } = useApp()
  const sessionService = useSessionService()
  const therapistService = useTherapistService()
  
  const createSession = async (sessionData: CreateSessionRequest) => {
    try {
      // Create session
      const session = await sessionService.createSession(sessionData)
      
      // Update therapist status
      await therapistService.updateTherapistStatus(
        sessionData.therapistIds[0], 
        'in-session'
      )
      
      // Update app state
      dispatch({ type: 'ADD_SESSION', payload: session })
      
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }
  
  return { createSession }
}
```

### Error Handling Pattern

```typescript
// Example: Consistent error handling
const useServiceWithErrorHandling = <T>(
  service: () => Promise<T>
) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await service()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  return { execute, loading, error }
}
```

### Data Synchronization Pattern

```typescript
// Example: Local storage with Supabase sync
const useDataSync = <T>(
  key: string,
  service: {
    get: () => Promise<T[]>
    save: (data: T[]) => Promise<void>
  }
) => {
  const [data, setData] = useState<T[]>([])
  const [syncing, setSyncing] = useState(false)
  
  const loadData = async () => {
    try {
      // Try to load from Supabase first
      const serverData = await service.get()
      setData(serverData)
      
      // Save to localStorage as backup
      localStorage.setItem(key, JSON.stringify(serverData))
    } catch (error) {
      // Fallback to localStorage
      const localData = localStorage.getItem(key)
      if (localData) {
        setData(JSON.parse(localData))
      }
    }
  }
  
  const syncData = async () => {
    setSyncing(true)
    try {
      await service.save(data)
      localStorage.setItem(key, JSON.stringify(data))
    } finally {
      setSyncing(false)
    }
  }
  
  return { data, setData, loadData, syncData, syncing }
}
```

## 🔧 Configuration

### Environment Variables

```typescript
// Environment configuration
interface EnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  appEnv: 'development' | 'production' | 'test'
  sentryDsn?: string
  enableDebug: boolean
}

// Usage
const config = initializeConfiguration()
```

### Feature Flags

```typescript
// Feature flag system
interface FeatureFlags {
  enableLazyLoading: boolean
  enablePerformanceMonitoring: boolean
  enableErrorReporting: boolean
  enableAccessibilityChecks: boolean
}

// Usage
const { enableLazyLoading } = useFeatureFlags()
```

## 📝 Best Practices

### Service Layer
- Keep services focused on single responsibilities
- Use TypeScript interfaces for all service contracts
- Implement proper error handling and logging
- Use dependency injection for testability

### Hook Design
- Follow the `use` prefix convention
- Return objects instead of arrays for better naming
- Include loading and error states
- Use proper cleanup in useEffect hooks

### Data Management
- Use local state for UI state
- Use context for global application state
- Implement optimistic updates for better UX
- Always provide fallback mechanisms

### Error Handling
- Use consistent error types and messages
- Implement proper error boundaries
- Log errors for debugging
- Provide user-friendly error messages

---

*This API documentation is automatically updated with the codebase. For the latest version, always refer to the source code and TypeScript definitions.*
