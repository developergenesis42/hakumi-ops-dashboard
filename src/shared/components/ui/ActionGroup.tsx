import React, { createContext, useContext } from 'react';
import { ActionButton } from '@/shared/components/ui/ActionButton';
import { cn } from '@/utils/helpers';

interface ActionGroupContextValue {
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
}

const ActionGroupContext = createContext<ActionGroupContextValue>({});

interface ActionGroupProps {
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActionGroup({ 
  children, 
  layout = 'horizontal', 
  size = 'md',
  className = '' 
}: ActionGroupProps) {
  const layoutClasses = {
    horizontal: 'flex gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2'
  };

  return (
    <ActionGroupContext.Provider value={{ layout, size }}>
      <div className={cn(layoutClasses[layout], className)}>
        {children}
      </div>
    </ActionGroupContext.Provider>
  );
}

interface ActionItemProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function ActionItem({ 
  onClick, 
  children, 
  variant = 'primary',
  icon,
  disabled = false,
  fullWidth = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: ActionItemProps) {
  const { size } = useContext(ActionGroupContext);
  
  return (
    <ActionButton
      onClick={onClick}
      variant={variant}
      size={size}
      icon={icon}
      disabled={disabled}
      fullWidth={fullWidth}
      className={className}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </ActionButton>
  );
}

// Compound component pattern
ActionGroup.Item = ActionItem;
