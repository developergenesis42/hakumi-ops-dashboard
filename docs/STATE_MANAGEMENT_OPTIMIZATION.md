# State Management Optimization Guide

This document outlines the state management optimizations implemented in the SPA Operations Dashboard to improve performance, reduce re-renders, and maintain clean, maintainable code.

## Overview

The optimizations focus on three main areas:
1. **useReducer for Complex Local State** - Replacing multiple useState hooks with useReducer
2. **State Normalization** - Converting arrays to normalized objects for efficient lookups
3. **Re-render Prevention** - Using memoization and stable references

## 1. useReducer Implementation

### Before: Multiple useState Hooks
```typescript
// ❌ Multiple useState hooks - causes multiple re-renders
const [currentStep, setCurrentStep] = useState<ModalStep>('service-category');
const [selectedServiceCategory, setSelectedServiceCategory] = useState<'Single' | 'Double' | 'Couple' | null>(null);
const [selectedService, setSelectedService] = useState<Service | null>(null);
const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
const [selectedTherapist2, setSelectedTherapist2] = useState<Therapist | null>(null);
const [discount, setDiscount] = useState(0);
const [isSubmitting, setIsSubmitting] = useState(false);
```

### After: useReducer Pattern
```typescript
// ✅ Single useReducer - single re-render per state update
const [modalState, modalDispatch] = useReducer(sessionModalReducer, initialState);

// Actions are dispatched instead of multiple setState calls
modalDispatch({ type: 'SET_SERVICE', payload: service });
modalDispatch({ type: 'HANDLE_NEXT' });
```

### Benefits:
- **Single Re-render**: All related state updates happen in one render cycle
- **Predictable State Updates**: All state changes go through the reducer
- **Better Performance**: Reduces the number of component re-renders
- **Easier Testing**: State logic is centralized and testable

## 2. State Normalization

### Before: Array-based State
```typescript
// ❌ Array-based state - O(n) lookups
interface AppState {
  therapists: Therapist[];
  rooms: Room[];
  services: Service[];
  sessions: Session[];
}
```

### After: Normalized State
```typescript
// ✅ Normalized state - O(1) lookups
interface NormalizedTherapists {
  byId: Record<string, Therapist>;
  allIds: string[];
}

// Efficient lookups
const therapist = selectTherapistById(normalizedTherapists, id);
const room = selectRoomById(normalizedRooms, id);
```

### Benefits:
- **O(1) Lookups**: Direct access by ID instead of array searches
- **Efficient Updates**: Update specific items without recreating entire arrays
- **Better Performance**: Reduces computational complexity for large datasets
- **Consistent Structure**: Standardized way to access entities

## 3. Re-render Prevention

### Memoization Utilities

#### useStableReference
```typescript
// Prevents re-renders when object reference changes but content is the same
const stableTherapist = useStableReference(therapist);
```

#### useMemoizedArray
```typescript
// Memoizes array creation with deep equality checking
const statisticsCards = useMemoizedArray(() => [
  // ... array items
], [calculatedStats]);
```

#### useStableEventHandler
```typescript
// Creates stable event handlers that don't change on every render
const handleClick = useStableEventHandler(() => {
  // handler logic
});
```

### Benefits:
- **Reduced Re-renders**: Components only re-render when data actually changes
- **Stable References**: Prevents unnecessary child component re-renders
- **Better Performance**: Reduces computational overhead
- **Predictable Behavior**: Consistent component behavior

## Implementation Examples

### 1. Optimized Session Modal Hook

```typescript
// useSessionModal.ts
export function useSessionModal(isOpen: boolean, onClose: () => void, therapist: Therapist) {
  const [modalState, modalDispatch] = useReducer(sessionModalReducer, initialState);
  
  // Memoized computed values
  const availableRooms = useMemo(() => {
    // Complex room filtering logic
  }, [modalState.selectedService, state.rooms, isManualAdd]);
  
  // Stable event handlers
  const handleNext = useCallback(() => {
    modalDispatch({ type: 'HANDLE_NEXT' });
  }, []);
  
  return {
    // State
    currentStep: modalState.currentStep,
    selectedService: modalState.selectedService,
    // ... other state
    
    // Actions
    handleNext,
    handleBack,
    // ... other actions
    
    // Computed
    availableRooms,
    // ... other computed values
  };
}
```

### 2. Optimized Component with Normalized State

```typescript
// TherapistList.tsx
export function TherapistList({ therapists, selectedTherapistId, onTherapistSelect }) {
  // Normalize data for efficient lookups
  const normalizedTherapists = useMemo(() => normalizeTherapists(therapists), [therapists]);
  
  // Stable reference to prevent unnecessary re-renders
  const stableTherapists = useStableReference(therapists);
  
  // Memoized selected therapist lookup
  const selectedTherapist = useMemo(() => {
    if (!selectedTherapistId) return undefined;
    return selectTherapistById(normalizedTherapists, selectedTherapistId);
  }, [normalizedTherapists, selectedTherapistId]);
  
  // Memoized list for rendering
  const therapistList = useMemoizedArray(() => {
    return stableTherapists.map(therapist => ({
      ...therapist,
      isSelected: therapist.id === selectedTherapistId,
      // Pre-computed derived values
      displayName: therapist.name,
      statusColor: getStatusColor(therapist.status),
    }));
  }, [stableTherapists, selectedTherapistId]);
  
  return (
    <div>
      {therapistList.map(therapist => (
        <TherapistItem key={therapist.id} therapist={therapist} />
      ))}
    </div>
  );
}
```

## Performance Benefits

### Before Optimization:
- **Multiple Re-renders**: Each useState update caused a re-render
- **O(n) Lookups**: Array searches for finding entities by ID
- **Unstable References**: Objects recreated on every render
- **Expensive Computations**: Recalculated on every render

### After Optimization:
- **Single Re-renders**: useReducer batches state updates
- **O(1) Lookups**: Direct access to normalized entities
- **Stable References**: Objects only change when content changes
- **Memoized Computations**: Expensive calculations cached

## Best Practices

### 1. When to Use useReducer
- ✅ Multiple related state variables
- ✅ Complex state update logic
- ✅ State updates that depend on previous state
- ❌ Simple boolean or string state

### 2. When to Use State Normalization
- ✅ Large datasets (100+ items)
- ✅ Frequent lookups by ID
- ✅ Complex relationships between entities
- ❌ Small, simple arrays

### 3. When to Use Memoization
- ✅ Expensive computations
- ✅ Object/array creation in render
- ✅ Event handlers passed to children
- ❌ Simple primitive values

## Migration Guide

### Step 1: Identify Complex State
Look for components with multiple useState hooks that are related:
```typescript
// Look for patterns like this:
const [step, setStep] = useState(1);
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Step 2: Create Reducer
```typescript
interface State {
  step: number;
  data: any;
  loading: boolean;
  error: string | null;
}

type Action = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_DATA'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    // ... other cases
  }
}
```

### Step 3: Replace useState with useReducer
```typescript
const [state, dispatch] = useReducer(reducer, initialState);
```

### Step 4: Add Memoization
```typescript
const memoizedValue = useMemo(() => expensiveComputation(state), [state]);
const stableHandler = useStableEventHandler(() => handleClick());
```

## Testing Considerations

### Testing useReducer
```typescript
describe('sessionModalReducer', () => {
  it('should handle SET_SERVICE action', () => {
    const state = { selectedService: null };
    const action = { type: 'SET_SERVICE', payload: mockService };
    const result = sessionModalReducer(state, action);
    expect(result.selectedService).toBe(mockService);
  });
});
```

### Testing Memoized Components
```typescript
describe('TherapistList', () => {
  it('should not re-render when props are the same', () => {
    const { rerender } = render(<TherapistList therapists={mockTherapists} />);
    const initialRenderCount = getRenderCount();
    
    rerender(<TherapistList therapists={mockTherapists} />);
    expect(getRenderCount()).toBe(initialRenderCount);
  });
});
```

## Conclusion

These optimizations provide significant performance improvements while maintaining code readability and maintainability. The key is to apply them judiciously based on the specific needs of each component and the size of the data being managed.

Remember:
- Start with the biggest performance bottlenecks
- Measure before and after optimizations
- Don't over-optimize simple components
- Focus on user experience improvements
