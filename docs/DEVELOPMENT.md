# 👨‍💻 Development Guide

Comprehensive development guide for the SPA Operations Dashboard, covering coding standards, testing practices, contribution guidelines, and development workflows.

## 📋 Table of Contents

- [Development Environment](#development-environment)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Code Quality](#code-quality)
- [Performance Guidelines](#performance-guidelines)
- [Contributing](#contributing)
- [Release Process](#release-process)

## 🛠️ Development Environment

### Prerequisites

**Required Software**
- **Node.js** 18.0.0+ with npm 9.0.0+
- **Git** 2.30.0+
- **VS Code** (recommended) with extensions
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

**VS Code Extensions**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase",
    "ms-playwright.playwright",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
```

### Environment Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd spa-ops-dashboard-dev
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Database Setup**
   ```bash
   # Follow database/README.md for setup
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Development Tools

**Package Scripts**
```json
{
  "dev": "vite",                    // Development server
  "build": "tsc -b && vite build",  // Production build
  "preview": "vite preview",        // Preview build
  "lint": "eslint .",               // Lint code
  "test": "jest",                   // Unit tests
  "test:e2e": "playwright test"     // E2E tests
}
```

## 📝 Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface Therapist {
  id: string
  name: string
  status: 'available' | 'in-session' | 'departed'
  totalEarnings: number
  expenses: Expense[]
}

// Use type aliases for unions
type TherapistStatus = 'available' | 'in-session' | 'departed'

// Use enums for constants
enum SessionStep {
  SERVICE_SELECTION = 'service-selection',
  ROOM_SELECTION = 'room-selection',
  CONFIRMATION = 'confirmation'
}
```

#### Function Signatures
```typescript
// Explicit return types for public functions
export const createSession = async (data: CreateSessionRequest): Promise<Session> => {
  // Implementation
}

// Use arrow functions for simple operations
const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`

// Use function declarations for complex logic
function calculatePayout(earnings: number, expenses: number): number {
  // Complex calculation logic
  return Math.max(0, earnings - expenses)
}
```

#### Error Handling
```typescript
// Consistent error handling pattern
const handleServiceCall = async <T>(
  serviceCall: () => Promise<T>
): Promise<T> => {
  try {
    return await serviceCall()
  } catch (error) {
    console.error('Service call failed:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}
```

### React Guidelines

#### Component Structure
```typescript
// Component with proper TypeScript
interface TherapistCardProps {
  therapist: Therapist
  onStatusChange?: (therapist: Therapist, status: TherapistStatus) => void
}

export const TherapistCard: React.FC<TherapistCardProps> = ({
  therapist,
  onStatusChange
}) => {
  // Component logic
  return (
    <div className="therapist-card">
      {/* JSX content */}
    </div>
  )
}
```

#### Hooks Usage
```typescript
// Custom hooks with proper typing
const useSessionManagement = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const createSession = useCallback(async (data: CreateSessionRequest) => {
    setLoading(true)
    setError(null)
    try {
      const session = await sessionService.createSession(data)
      setSessions(prev => [...prev, session])
      return session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { sessions, loading, error, createSession }
}
```

#### State Management
```typescript
// Reducer with proper typing
type AppAction = 
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'UPDATE_THERAPIST_STATUS'; payload: { id: string; status: TherapistStatus } }
  | { type: 'SET_LOADING'; payload: boolean }

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload]
      }
    case 'UPDATE_THERAPIST_STATUS':
      return {
        ...state,
        therapists: state.therapists.map(t =>
          t.id === action.payload.id
            ? { ...t, status: action.payload.status }
            : t
        )
      }
    default:
      return state
  }
}
```

### CSS/Styling Guidelines

#### Tailwind CSS Usage
```typescript
// Use Tailwind classes consistently
const buttonClasses = `
  px-4 py-2 rounded-lg font-medium transition-colors
  bg-blue-600 hover:bg-blue-700 text-white
  disabled:opacity-50 disabled:cursor-not-allowed
`

// Conditional classes with clsx
import clsx from 'clsx'

const getStatusClasses = (status: TherapistStatus) => clsx(
  'px-2 py-1 rounded text-sm font-medium',
  {
    'bg-green-100 text-green-800': status === 'available',
    'bg-yellow-100 text-yellow-800': status === 'in-session',
    'bg-red-100 text-red-800': status === 'departed'
  }
)
```

#### Component Styling
```typescript
// Consistent component styling patterns
const cardStyles = {
  container: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
  header: 'flex items-center justify-between mb-4',
  title: 'text-lg font-semibold text-gray-900',
  content: 'text-gray-600',
  actions: 'flex gap-2 mt-4'
}
```

### File Organization

#### File Naming Conventions
```
components/
├── TherapistCard.tsx           # PascalCase for components
├── session/
│   ├── SessionModal.tsx       # Feature-based grouping
│   ├── SessionStep.tsx
│   └── index.ts               # Barrel exports
├── ui/
│   ├── Button.tsx             # Reusable UI components
│   ├── Modal.tsx
│   └── Toast.tsx
└── auth/
    ├── AuthModal.tsx          # Domain-based grouping
    ├── LoginForm.tsx
    └── UserMenu.tsx

hooks/
├── useSession.ts              # camelCase for hooks
├── useAuth.ts
└── useValidation.ts

services/
├── sessionService.ts          # camelCase for services
├── therapistService.ts
└── walkoutService.ts

utils/
├── helpers.ts                 # camelCase for utilities
├── validation.ts
└── formatting.ts
```

#### Import Organization
```typescript
// 1. React imports
import React, { useState, useEffect, useCallback } from 'react'

// 2. Third-party imports
import { createClient } from '@supabase/supabase-js'
import clsx from 'clsx'

// 3. Internal imports (absolute paths)
import { useApp } from '@/hooks/useApp'
import { sessionService } from '@/services/sessionService'

// 4. Relative imports
import './TherapistCard.css'
import type { Therapist } from '../types'
```

## 🏗️ Project Structure

### Directory Organization

```
src/
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── session/            # Session management
│   ├── roster/             # Roster management
│   ├── ui/                 # Reusable UI components
│   ├── accessibility/      # Accessibility components
│   └── admin/              # Admin components
├── hooks/                  # Custom React hooks
├── services/               # Business logic services
├── context/                # React context providers
├── utils/                  # Utility functions
├── types/                  # TypeScript type definitions
├── constants/              # Application constants
├── config/                 # Configuration files
├── data/                   # Mock data and fixtures
└── __tests__/              # Test files
```

### Component Architecture

#### Feature-Based Organization
```
components/
├── session/                 # Session feature
│   ├── SessionModal.tsx    # Main session modal
│   ├── ServiceSelection.tsx # Service selection step
│   ├── RoomSelection.tsx   # Room selection step
│   ├── ConfirmStep.tsx     # Confirmation step
│   ├── hooks/
│   │   └── useSessionModal.ts # Session modal logic
│   └── index.ts            # Barrel exports
```

#### Shared Components
```
components/ui/
├── Button.tsx              # Reusable button
├── Modal.tsx               # Modal wrapper
├── Toast.tsx               # Notification toast
├── LoadingSpinner.tsx      # Loading indicator
└── index.ts                # Barrel exports
```

### Service Layer Organization

```
services/
├── sessionService.ts       # Session CRUD operations
├── therapistService.ts     # Therapist management
├── walkoutService.ts       # Walk-out tracking
├── expenseService.ts       # Expense management
├── authService.ts          # Authentication
├── baseService.ts          # Base service class
└── index.ts                # Service exports
```

## 🔄 Development Workflow

### Git Workflow

#### Branch Naming
```bash
# Feature branches
feature/session-management
feature/therapist-roster
feature/financial-reporting

# Bug fixes
bugfix/login-authentication
bugfix/session-timer
bugfix/data-persistence

# Hotfixes
hotfix/security-patch
hotfix/critical-bug

# Chores
chore/update-dependencies
chore/refactor-components
```

#### Commit Messages
```bash
# Format: type(scope): description
feat(session): add session timer functionality
fix(auth): resolve login timeout issue
docs(api): update service documentation
refactor(components): extract reusable button component
test(e2e): add session creation tests
chore(deps): update React to v19
```

#### Pull Request Process
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Write code following standards
   - Add tests for new functionality
   - Update documentation

3. **Test Changes**
   ```bash
   npm run lint
   npm test
   npm run test:e2e
   ```

4. **Create Pull Request**
   - Use descriptive title
   - Include detailed description
   - Link related issues
   - Request code review

### Code Review Process

#### Review Checklist
- [ ] **Code Quality**
  - [ ] Follows coding standards
  - [ ] Proper TypeScript usage
  - [ ] No console.log statements
  - [ ] Proper error handling

- [ ] **Functionality**
  - [ ] Works as expected
  - [ ] Handles edge cases
  - [ ] No breaking changes
  - [ ] Performance acceptable

- [ ] **Testing**
  - [ ] Unit tests added/updated
  - [ ] E2E tests for user flows
  - [ ] All tests passing
  - [ ] Test coverage maintained

- [ ] **Documentation**
  - [ ] Code is self-documenting
  - [ ] Complex logic commented
  - [ ] API docs updated
  - [ ] User guide updated if needed

#### Review Guidelines
```typescript
// Good: Clear, descriptive code
const calculateTherapistPayout = (
  sessionEarnings: number, 
  expenses: number
): number => {
  return Math.max(0, sessionEarnings - expenses)
}

// Bad: Unclear, poorly named
const calc = (a: number, b: number) => Math.max(0, a - b)
```

## 🧪 Testing Guidelines

### Testing Strategy

#### Test Pyramid
```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/________\  
          \  Unit Tests (Many)
           \________________
```

#### Unit Testing (Jest + RTL)

**Component Testing**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { TherapistCard } from '../TherapistCard'

describe('TherapistCard', () => {
  const mockTherapist: Therapist = {
    id: '1',
    name: 'Alice',
    status: 'available',
    totalEarnings: 100,
    expenses: []
  }

  it('renders therapist information correctly', () => {
    render(<TherapistCard therapist={mockTherapist} />)
    
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('handles status change', () => {
    const onStatusChange = jest.fn()
    render(
      <TherapistCard 
        therapist={mockTherapist} 
        onStatusChange={onStatusChange}
      />
    )
    
    fireEvent.click(screen.getByText('Available'))
    expect(onStatusChange).toHaveBeenCalledWith(mockTherapist, 'in-session')
  })
})
```

**Hook Testing**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useSessionManagement } from '../useSessionManagement'

describe('useSessionManagement', () => {
  it('creates session successfully', async () => {
    const { result } = renderHook(() => useSessionManagement())
    
    const sessionData = {
      therapistIds: ['1'],
      serviceId: 'service-1',
      roomId: 'room-1'
    }
    
    await act(async () => {
      await result.current.createSession(sessionData)
    })
    
    expect(result.current.sessions).toHaveLength(1)
    expect(result.current.loading).toBe(false)
  })
})
```

**Service Testing**
```typescript
import { sessionService } from '../sessionService'

// Mock Supabase
jest.mock('@supabase/supabase-js')

describe('sessionService', () => {
  it('creates session with valid data', async () => {
    const sessionData = {
      therapistIds: ['1'],
      serviceId: 'service-1',
      roomId: 'room-1'
    }
    
    const session = await sessionService.createSession(sessionData)
    
    expect(session).toBeDefined()
    expect(session.therapistIds).toEqual(['1'])
  })
})
```

#### Integration Testing

**API Integration**
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { SessionModal } from '../SessionModal'

describe('SessionModal Integration', () => {
  it('creates session end-to-end', async () => {
    render(<SessionModal isOpen={true} therapist={mockTherapist} />)
    
    // Select service
    fireEvent.click(screen.getByText('Single'))
    fireEvent.click(screen.getByText('60 min'))
    
    // Select room
    fireEvent.click(screen.getByText('Shower 1'))
    
    // Confirm session
    fireEvent.click(screen.getByText('Confirm'))
    
    await waitFor(() => {
      expect(screen.getByText('Session created successfully')).toBeInTheDocument()
    })
  })
})
```

#### E2E Testing (Playwright)

**User Workflow Testing**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Complete Session Workflow', () => {
  test('should create and complete session', async ({ page }) => {
    // Login
    await page.goto('/')
    await page.click('text=🧪 Test Admin Login')
    
    // Setup roster
    await page.fill('input[placeholder="Search therapists..."]', 'Alice')
    await page.click('button:has-text("Alice")')
    await page.click('button:has-text("Start Day")')
    
    // Create session
    await page.click('button:has-text("New Session")')
    await page.click('button:has-text("Single")')
    await page.click('button:has-text("60 min")')
    await page.click('button:has-text("Shower 1")')
    await page.click('button:has-text("Confirm")')
    
    // Complete session
    await page.click('button:has-text("Complete")')
    
    // Verify session completed
    await expect(page.getByText('Session completed')).toBeVisible()
  })
})
```

### Test Coverage Requirements

- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: All critical user flows
- **E2E Tests**: Complete user journeys
- **Component Tests**: All public component APIs

### Running Tests

```bash
# Unit tests
npm test                    # Run all unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# E2E tests
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # Visible browser
npm run test:e2e:debug     # Debug mode

# Specific test suites
npm run test:e2e:auth      # Authentication tests
npm run test:e2e:sessions  # Session management tests
```

## 🎯 Code Quality

### Linting and Formatting

#### ESLint Configuration
```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
]
```

#### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### Code Review Standards

#### Performance Considerations
```typescript
// Good: Memoized expensive calculations
const expensiveValue = useMemo(() => {
  return therapists.reduce((sum, therapist) => sum + therapist.totalEarnings, 0)
}, [therapists])

// Good: Debounced search
const debouncedSearch = useCallback(
  debounce((query: string) => {
    setSearchResults(searchTherapists(query))
  }, 300),
  []
)
```

#### Accessibility Standards
```typescript
// Good: Accessible button
<button
  aria-label="Complete session"
  aria-describedby="session-description"
  onClick={handleComplete}
>
  Complete
</button>

// Good: Form labels
<label htmlFor="therapist-name">Therapist Name</label>
<input
  id="therapist-name"
  type="text"
  aria-required="true"
  aria-invalid={hasError}
/>
```

#### Error Boundaries
```typescript
// Error boundary implementation
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

## ⚡ Performance Guidelines

### React Performance

#### Memoization
```typescript
// Memoize expensive components
const TherapistCard = React.memo(({ therapist, onStatusChange }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.therapist.id === nextProps.therapist.id &&
         prevProps.therapist.status === nextProps.therapist.status
})

// Memoize expensive calculations
const sessionStats = useMemo(() => {
  return calculateSessionStatistics(sessions)
}, [sessions])

// Memoize event handlers
const handleStatusChange = useCallback((therapistId: string, status: TherapistStatus) => {
  updateTherapistStatus(therapistId, status)
}, [])
```

#### Code Splitting
```typescript
// Route-based code splitting
const RosterSetup = lazy(() => import('../components/RosterSetup'))
const MainDashboard = lazy(() => import('../components/MainDashboard'))

// Component-based code splitting
const SessionModal = lazy(() => import('../components/SessionModal'))

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <RosterSetup />
</Suspense>
```

### Bundle Optimization

#### Tree Shaking
```typescript
// Import only what you need
import { formatCurrency } from '@/utils/helpers'
// Not: import * as helpers from '@/utils/helpers'

// Use named exports
export const calculatePayout = (earnings: number, expenses: number) => {
  return Math.max(0, earnings - expenses)
}
```

#### Dynamic Imports
```typescript
// Load heavy libraries dynamically
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js')
  return Chart
}

// Use dynamic imports for heavy components
const HeavyChart = lazy(() => import('./HeavyChart'))
```

### Network Optimization

#### Data Fetching
```typescript
// Optimize API calls
const useOptimizedData = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Batch multiple requests
      const [therapists, rooms, services] = await Promise.all([
        therapistService.getTherapists(),
        roomService.getRooms(),
        serviceService.getServices()
      ])
      
      setData({ therapists, rooms, services })
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, fetchData }
}
```

## 🤝 Contributing

### Getting Started

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone
   git clone https://github.com/your-username/spa-ops-dashboard-dev.git
   cd spa-ops-dashboard-dev
   ```

2. **Set Up Development Environment**
   ```bash
   npm install
   cp .env.example .env.local
   # Configure environment variables
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Process

#### Before Starting Work
- [ ] Check existing issues and discussions
- [ ] Create issue for new features
- [ ] Discuss approach with maintainers

#### During Development
- [ ] Follow coding standards
- [ ] Write tests for new functionality
- [ ] Update documentation
- [ ] Test in multiple browsers

#### Before Submitting
- [ ] Run all tests and ensure they pass
- [ ] Update CHANGELOG.md
- [ ] Create pull request with clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
```

### Issue Templates

#### Bug Report
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information
```

#### Feature Request
```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this be implemented?

## Alternatives Considered
Other approaches you've considered

## Additional Context
Any other relevant information
```

## 🚀 Release Process

### Version Management

#### Semantic Versioning
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **PATCH** (1.0.1): Bug fixes, backward compatible

#### Release Workflow
```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Build and test
npm run build
npm run test:all

# 3. Create release
git push origin main --tags
# Create release on GitHub with changelog
```

### Changelog Management

#### Keep a Changelog Format
```markdown
# Changelog

## [1.1.0] - 2024-01-15

### Added
- Session timer functionality
- Export to CSV feature
- Dark mode toggle

### Changed
- Improved session creation flow
- Updated therapist status icons

### Fixed
- Fixed login timeout issue
- Resolved data persistence bug

### Security
- Updated dependencies with security patches
```

### Deployment Process

#### Staging Deployment
```bash
# Deploy to staging environment
npm run build:staging
# Deploy to staging server
# Run E2E tests against staging
```

#### Production Deployment
```bash
# Final checks
npm run test:all
npm run build
npm run preview  # Test production build locally

# Deploy to production
# Monitor for issues
# Update documentation
```

---

**Happy Coding!** 🎉 

For questions or support, please open an issue or start a discussion in the repository.
