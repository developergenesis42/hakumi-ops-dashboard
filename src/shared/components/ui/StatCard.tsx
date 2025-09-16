import { cn } from '@/utils/helpers';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'interactive' | 'expense';
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  className = '',
  onClick,
  variant = 'default'
}: StatCardProps) {
  const baseClasses = 'p-3 rounded-lg min-w-[120px] flex-shrink-0 transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-gray-800',
    interactive: 'bg-gray-800 border-2 border-orange-500/30 hover:border-orange-400/50 hover:bg-gray-700 cursor-pointer group',
    expense: 'bg-gray-800 border-2 border-orange-500/30 hover:border-orange-400/50 hover:bg-gray-700 cursor-pointer group'
  };

  const classes = cn(baseClasses, variantClasses[variant], className);

  return (
    <div className={classes} onClick={onClick} title={onClick ? 'Click to view details' : undefined}>
      <div className={cn(
        'text-xs font-medium text-gray-300 flex items-center gap-1 mb-1',
        variant === 'interactive' && 'group-hover:text-orange-200',
        variant === 'expense' && 'text-orange-300 group-hover:text-orange-200'
      )}>
        <span className="text-sm">{icon}</span>
        {label}
        {onClick && (
          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <div className={cn(
        'text-xl font-bold text-white',
        variant === 'expense' && 'text-orange-400 group-hover:text-orange-300'
      )}>
        {value}
      </div>
    </div>
  );
}

export default StatCard;
