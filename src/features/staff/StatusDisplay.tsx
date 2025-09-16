import React from 'react';
import type { Therapist } from '@/types';

interface StatusDisplayProps {
  therapist: Therapist;
}

export function StatusDisplay({ therapist }: StatusDisplayProps) {
  const statusDisplay = React.useMemo(() => {
    switch (therapist.status) {
      case 'inactive':
        return { text: 'Inactive', color: 'text-gray-400', bgColor: 'bg-gray-600' };
      case 'available':
        return { text: 'Available', color: 'text-green-300', bgColor: 'bg-green-600', glow: 'shadow-green-400/60 shadow-lg animate-pulse' };
      case 'in-session':
        return { text: 'Working Now', color: 'text-red-300', bgColor: 'bg-red-600', glow: 'shadow-red-400/60 shadow-lg animate-pulse' };
      case 'departed':
        return { text: 'Leave Work', color: 'text-red-400', bgColor: 'bg-red-600' };
      default:
        return { text: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-600' };
    }
  }, [therapist.status]);

  const statusStyle = React.useMemo(() => {
    if (therapist.status === 'available') {
      return {
        color: '#86efac', // text-green-300
        textShadow: '0 0 8px rgba(74, 222, 128, 0.6)', // green glow
        filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.4))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      };
    }
    if (therapist.status === 'in-session') {
      return {
        color: '#fca5a5', // text-red-300
        textShadow: '0 0 8px rgba(248, 113, 113, 0.6)', // red glow
        filter: 'drop-shadow(0 0 4px rgba(248, 113, 113, 0.4))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      };
    }
    return {};
  }, [therapist.status]);

  const totalExpenses = React.useMemo(() => {
    return therapist.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  }, [therapist.expenses]);

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={`text-sm font-medium ${statusDisplay.color} ${statusDisplay.glow || ''}`}
        style={statusStyle}
      >
        •{statusDisplay.text}
      </span>
      
      {/* Expense indicator */}
      {therapist.expenses && therapist.expenses.length > 0 && (
        <div className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full border-2 border-yellow-400 shadow-sm">
          <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
