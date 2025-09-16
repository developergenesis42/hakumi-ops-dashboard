import React from 'react';
import { useMemo } from 'react';
import type { Therapist } from '@/types';
import { useStableReference, useMemoizedArray } from '@/utils/memoization';
import { normalizeTherapists, selectTherapistById } from '@/utils/stateNormalization';

interface TherapistListProps {
  therapists: Therapist[];
  selectedTherapistId?: string;
  onTherapistSelect?: (therapist: Therapist) => void;
  onTherapistUpdate?: (id: string, updates: Partial<Therapist>) => void;
}

// Optimized TherapistList component using normalized state and memoization
export function TherapistList({ 
  therapists, 
  selectedTherapistId, 
  onTherapistSelect, 
  onTherapistUpdate 
}: TherapistListProps) {
  // Normalize therapists for efficient lookups
  const normalizedTherapists = useMemo(() => normalizeTherapists(therapists), [therapists]);
  
  // Use stable reference to prevent unnecessary re-renders
  const stableTherapists = useStableReference(therapists);
  
  // Memoized selected therapist lookup
  const selectedTherapist = useMemo(() => {
    if (!selectedTherapistId) return undefined;
    return selectTherapistById(normalizedTherapists, selectedTherapistId);
  }, [normalizedTherapists, selectedTherapistId]);
  
  // Memoized therapist list for rendering
  const therapistList = useMemoizedArray(() => {
    return stableTherapists.map(therapist => ({
      ...therapist,
      isSelected: therapist.id === selectedTherapistId,
      // Pre-compute derived values to avoid recalculation in render
      displayName: therapist.name,
      statusColor: getStatusColor(therapist.status),
      earningsDisplay: formatCurrency(therapist.totalEarnings || 0),
      sessionsCount: therapist.totalSessions || 0
    }));
  }, [stableTherapists, selectedTherapistId]);
  
  // Memoized event handlers
  const handleTherapistClick = useMemo(() => {
    if (!onTherapistSelect) return undefined;
    
    return (therapist: Therapist) => {
      onTherapistSelect(therapist);
    };
  }, [onTherapistSelect]);
  
  const handleTherapistUpdate = useMemo(() => {
    if (!onTherapistUpdate) return undefined;
    
    return (id: string, updates: Partial<Therapist>) => {
      onTherapistUpdate(id, updates);
    };
  }, [onTherapistUpdate]);
  
  return (
    <div className="therapist-list">
      <h3 className="text-lg font-semibold mb-4">Therapists ({therapistList.length})</h3>
      
      {selectedTherapist && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium">Selected: {selectedTherapist.name}</h4>
          <p className="text-sm text-gray-600">
            Status: {selectedTherapist.status} | 
            Earnings: {formatCurrency(selectedTherapist.totalEarnings || 0)} | 
            Sessions: {selectedTherapist.totalSessions || 0}
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        {therapistList.map(therapist => (
          <TherapistItem
            key={therapist.id}
            therapist={therapist}
            onClick={handleTherapistClick}
            onUpdate={handleTherapistUpdate}
          />
        ))}
      </div>
    </div>
  );
}

// Memoized individual therapist item component
const TherapistItem = React.memo<{
  therapist: Therapist & {
    isSelected: boolean;
    displayName: string;
    statusColor: string;
    earningsDisplay: string;
    sessionsCount: number;
  };
  onClick?: (therapist: Therapist) => void;
  onUpdate?: (id: string, updates: Partial<Therapist>) => void;
}>(({ therapist, onClick, onUpdate }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(therapist);
    }
  };
  
  const handleStatusChange = (newStatus: Therapist['status']) => {
    if (onUpdate) {
      onUpdate(therapist.id, { status: newStatus });
    }
  };
  
  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        therapist.isSelected 
          ? 'bg-blue-100 border-blue-300' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{therapist.displayName}</h4>
          <p className="text-sm text-gray-600">
            {therapist.earningsDisplay} • {therapist.sessionsCount} sessions
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span 
            className={`w-3 h-3 rounded-full ${therapist.statusColor}`}
            title={therapist.status}
          />
          
          <select
            value={therapist.status}
            onChange={(e) => handleStatusChange(e.target.value as Therapist['status'])}
            className="text-xs border rounded px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="inactive">Inactive</option>
            <option value="available">Available</option>
            <option value="in-session">Working Now</option>
            <option value="departed">Leave Work</option>
          </select>
        </div>
      </div>
    </div>
  );
});

// Helper functions
function getStatusColor(status: Therapist['status']): string {
  switch (status) {
    case 'inactive': return 'bg-gray-400';
    case 'available': return 'bg-green-400';
    case 'in-session': return 'bg-blue-400';
    case 'departed': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
