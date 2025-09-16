import { useState, useMemo } from 'react';
import type { Therapist } from '@/types';

interface UseTherapistSearchProps {
  therapists: Therapist[];
  excludeIds?: string[];
}

interface UseTherapistSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTherapists: Therapist[];
  clearSearch: () => void;
}

export function useTherapistSearch({ 
  therapists, 
  excludeIds = [] 
}: UseTherapistSearchProps): UseTherapistSearchReturn {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTherapists = useMemo(() => {
    if (!searchTerm.trim()) {
      return therapists.filter(t => !excludeIds.includes(t.id));
    }

    const term = searchTerm.toLowerCase();
    
    return therapists.filter(therapist => {
      // Skip if therapist is in exclude list
      if (excludeIds.includes(therapist.id)) {
        return false;
      }

      const name = therapist.name.toLowerCase();
      
      // Progressive search logic
      if (term.length === 1) {
        return name.startsWith(term);
      } else {
        return name.includes(term);
      }
    });
  }, [therapists, searchTerm, excludeIds]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredTherapists,
    clearSearch,
  };
}
