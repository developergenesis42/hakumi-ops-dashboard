import { type ReactNode } from 'react';
import { THEME_COLORS } from '@/constants';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary';
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  variant = 'default'
}: CardProps) {
  const baseClasses = 'rounded-lg';
  const variantClasses = {
    default: THEME_COLORS.PRIMARY.card,
    secondary: THEME_COLORS.PRIMARY.cardSecondary,
  };
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
}
