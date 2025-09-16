import React, { createContext, useContext } from 'react';
import { StatCard } from '@/shared/components/ui/StatCard';
import { cn } from '@/utils/helpers';
import { withPropValidation, CommonValidators } from '@/utils/propValidation';

interface StatisticsContextValue {
  variant?: 'default' | 'compact';
}

const StatisticsContext = createContext<StatisticsContextValue>({});

/**
 * Props for the Statistics component
 */
interface StatisticsProps {
  /** Child components (StatItem components) */
  children: React.ReactNode;
  /** Visual variant of the statistics container */
  variant?: 'default' | 'compact';
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

function StatisticsComponent({ children, variant = 'default', className = '', 'aria-label': ariaLabel }: StatisticsProps) {
  return (
    <StatisticsContext.Provider value={{ variant }}>
      <div 
        className={cn(
          'flex gap-3 overflow-x-auto pb-2',
          variant === 'compact' && 'gap-2',
          className
        )}
        role="region"
        aria-label={ariaLabel || 'Statistics'}
      >
        {children}
      </div>
    </StatisticsContext.Provider>
  );
}

/**
 * Props for the StatItem component
 */
interface StatItemProps {
  /** Icon to display (emoji or icon string) */
  icon: string;
  /** Label text for the statistic */
  label: string;
  /** Value to display (string or number) */
  value: string | number;
  /** Click handler for interactive items */
  onClick?: () => void;
  /** Visual variant of the stat item */
  variant?: 'default' | 'interactive' | 'expense';
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

function StatItemComponent({ icon, label, value, onClick, variant = 'default', 'aria-label': ariaLabel }: StatItemProps) {
  const { variant: contextVariant } = useContext(StatisticsContext);
  
  return (
    <StatCard
      icon={icon}
      label={label}
      value={value}
      onClick={onClick}
      variant={variant}
      className={cn(
        contextVariant === 'compact' && 'min-w-[100px] p-2'
      )}
      aria-label={ariaLabel || `${label}: ${value}`}
    />
  );
}

// Validation schemas
const statisticsSchema = {
  children: { required: true, validator: CommonValidators.isReactNode },
  variant: { 
    type: 'string' as const,
    validator: (value: unknown) => typeof value === 'string' && ['default', 'compact'].includes(value)
  },
  className: { type: 'string' as const },
  'aria-label': { type: 'string' as const }
};

const statItemSchema = {
  icon: { required: true, type: 'string' as const, validator: (value: unknown) => typeof value === 'string' && CommonValidators.nonEmptyString(value) },
  label: { required: true, type: 'string' as const, validator: (value: unknown) => typeof value === 'string' && CommonValidators.nonEmptyString(value) },
  value: { required: true },
  onClick: { type: 'function' as const },
  variant: { 
    type: 'string' as const,
    validator: (value: unknown) => typeof value === 'string' && ['default', 'interactive', 'expense'].includes(value)
  },
  'aria-label': { type: 'string' as const }
};

// Export with prop validation
const Statistics = withPropValidation(
  StatisticsComponent as unknown as React.ComponentType<Record<string, unknown>>,
  statisticsSchema,
  'Statistics'
) as unknown as React.ComponentType<StatisticsProps>;

const StatItem = withPropValidation(
  StatItemComponent as unknown as React.ComponentType<Record<string, unknown>>,
  statItemSchema,
  'StatItem'
) as unknown as React.ComponentType<StatItemProps>;

// Compound component pattern
(Statistics as unknown as React.ComponentType<StatItemProps> & { Item: typeof StatItem }).Item = StatItem;

export { Statistics, StatItem };
