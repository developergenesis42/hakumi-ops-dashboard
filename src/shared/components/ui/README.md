# UI Component Composition Patterns

This directory contains reusable UI components that follow modern React composition patterns for better maintainability and reusability.

## Reusable UI Primitives

### StatCard
A reusable statistics card component with consistent styling and interactive states.

```tsx
import { StatCard } from './ui';

<StatCard
  icon="📊"
  label="Total Revenue"
  value="฿15,000"
  variant="default" // or "interactive" or "expense"
  onClick={() => console.log('Clicked!')}
/>
```

### StatusBadge
A status indicator with optional expense display.

```tsx
import { StatusBadge } from './ui';

<StatusBadge
  status="available"
  showExpenses={true}
  totalExpenses={1500}
/>
```

### ActionButton
A styled action button with consistent gradient effects and variants.

```tsx
import { ActionButton } from './ui';

<ActionButton
  onClick={handleAction}
  variant="success"
  size="md"
  icon={<CheckIcon />}
  fullWidth
>
  Complete Session
</ActionButton>
```

### IconButton
A compact icon-only button for toolbar actions.

```tsx
import { IconButton } from './ui';

<IconButton
  onClick={handleClose}
  variant="ghost"
  icon={<CloseIcon />}
  title="Close modal"
/>
```

## Compound Component Patterns

### Statistics
A compound component for displaying multiple statistics with consistent layout.

```tsx
import { Statistics } from './ui';

<Statistics className="mb-6">
  <Statistics.Item
    icon="📊"
    label="Total Slips"
    value={25}
    variant="default"
  />
  <Statistics.Item
    icon="💵"
    label="Revenue"
    value="฿15,000"
    variant="interactive"
    onClick={handleViewDetails}
  />
  <Statistics.Item
    icon="💰"
    label="Expenses"
    value="฿2,500"
    variant="expense"
    onClick={handleViewExpenses}
  />
</Statistics>
```

### ActionGroup
A compound component for organizing action buttons with consistent spacing and layout.

```tsx
import { ActionGroup } from './ui';

<ActionGroup layout="vertical" size="md">
  <ActionGroup.Item
    onClick={handleStart}
    variant="success"
    icon={<PlayIcon />}
    fullWidth
  >
    Start Session
  </ActionGroup.Item>
  <ActionGroup layout="horizontal">
    <ActionGroup.Item
      onClick={handleExpense}
      variant="warning"
      icon={<MoneyIcon />}
      fullWidth
    >
      Add Expense
    </ActionGroup.Item>
    <ActionGroup.Item
      onClick={handleDepart}
      variant="error"
      icon={<ExitIcon />}
      fullWidth
    >
      Leave
    </ActionGroup.Item>
  </ActionGroup>
</ActionGroup>
```

### FormSteps
A compound component for multi-step forms with built-in navigation.

```tsx
import { FormSteps } from './ui';

<FormSteps
  currentStep={2}
  totalSteps={5}
  onNext={handleNext}
  onBack={handleBack}
  onComplete={handleSubmit}
>
  <FormSteps.Header
    title="Package Selection"
    description="Choose your package category"
  />
  
  <FormSteps.Content>
    {/* Your step content here */}
    <ServiceCategoryStep />
  </FormSteps.Content>
  
  <FormSteps.Actions>
    <button onClick={handleCancel}>Cancel</button>
    <LoadingButton onClick={handleSubmit}>Submit</LoadingButton>
  </FormSteps.Actions>
</FormSteps>
```

## Benefits of This Approach

1. **Consistency**: All components follow the same design patterns and styling
2. **Reusability**: Components can be easily reused across different parts of the application
3. **Composability**: Compound components allow for flexible composition
4. **Maintainability**: Changes to styling or behavior only need to be made in one place
5. **Type Safety**: Full TypeScript support with proper prop types
6. **Performance**: Optimized with React.memo and proper memoization

## Usage Guidelines

1. **Always use the compound component pattern** for complex UI sections
2. **Prefer composition over inheritance** - build complex components from simple ones
3. **Keep components focused** - each component should have a single responsibility
4. **Use consistent naming** - follow the established patterns for variants and props
5. **Leverage TypeScript** - use proper typing for better developer experience
