import React from 'react';
import { cn } from '@/utils/helpers';
import { withPropValidation, CommonValidators } from '@/utils/propValidation';

/**
 * Props for the StatusBadge component
 */
interface StatusBadgeProps {
  /** Status of the therapist */
  status: 'inactive' | 'available' | 'in-session' | 'departed';
  /** Whether to show expenses indicator */
  showExpenses?: boolean;
  /** Total expenses amount to display */
  totalExpenses?: number;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

function StatusBadgeComponent({ 
  status, 
  showExpenses = false, 
  totalExpenses = 0,
  className = '',
  'aria-label': ariaLabel
}: StatusBadgeProps) {
  const statusConfig = React.useMemo(() => {
    switch (status) {
      case 'inactive':
        return { 
          text: 'Inactive', 
          color: 'text-gray-400', 
          bgColor: 'bg-gray-600',
          glow: ''
        };
      case 'available':
        return { 
          text: 'Available', 
          color: 'text-green-300', 
          bgColor: 'bg-green-600', 
          glow: 'shadow-green-400/60 shadow-lg animate-pulse' 
        };
      case 'in-session':
        return { 
          text: 'Working Now', 
          color: 'text-red-300', 
          bgColor: 'bg-red-600', 
          glow: 'shadow-red-400/60 shadow-lg animate-pulse' 
        };
      case 'departed':
        return { 
          text: 'Leave Work', 
          color: 'text-red-400', 
          bgColor: 'bg-red-600',
          glow: ''
        };
      default:
        return { 
          text: 'Unknown', 
          color: 'text-gray-400', 
          bgColor: 'bg-gray-600',
          glow: ''
        };
    }
  }, [status]);

  const statusStyle = React.useMemo(() => {
    if (status === 'available') {
      return {
        color: '#86efac',
        textShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
        filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.4))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      };
    }
    if (status === 'in-session') {
      return {
        color: '#fca5a5',
        textShadow: '0 0 8px rgba(248, 113, 113, 0.6)',
        filter: 'drop-shadow(0 0 4px rgba(248, 113, 113, 0.4))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      };
    }
    return {};
  }, [status]);

  return (
    <div 
      className={cn('flex items-center space-x-2', className)}
      aria-label={ariaLabel || `Status: ${statusConfig.text}${showExpenses && totalExpenses > 0 ? `, Expenses: ฿${totalExpenses.toLocaleString()}` : ''}`}
    >
      <span 
        className={cn(
          'text-sm font-medium',
          statusConfig.color,
          statusConfig.glow
        )}
        style={statusStyle}
        role="status"
        aria-live="polite"
      >
        •{statusConfig.text}
      </span>
      
      {showExpenses && totalExpenses > 0 && (
        <div 
          className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full border-2 border-yellow-400 shadow-sm"
          aria-label={`Expenses: ฿${totalExpenses.toLocaleString()}`}
        >
          <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span 
            className="font-bold text-black" 
            style={{ 
              color: '#000000',
              fontWeight: '700'
            }}
          >
            ฿{totalExpenses.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

// Validation schema for StatusBadge
const statusBadgeSchema = {
  status: { 
    required: true, 
    type: 'string' as const,
    validator: (value: unknown) => typeof value === 'string' && ['inactive', 'available', 'in-session', 'departed'].includes(value)
  },
  showExpenses: { type: 'boolean' as const },
  totalExpenses: { 
    type: 'number' as const,
    validator: (value: unknown) => typeof value === 'number' && CommonValidators.nonNegative(value)
  },
  className: { type: 'string' as const },
  'aria-label': { type: 'string' as const }
};

// Export with prop validation
export const StatusBadge = withPropValidation(
  StatusBadgeComponent as unknown as React.ComponentType<Record<string, unknown>>,
  statusBadgeSchema,
  'StatusBadge'
) as unknown as React.ComponentType<StatusBadgeProps>;

export default StatusBadge;
