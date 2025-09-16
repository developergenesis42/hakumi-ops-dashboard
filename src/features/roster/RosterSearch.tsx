import * as React from 'react';
import Input from '@/shared/components/ui/Input';
import { useTherapistSearch } from '@/hooks/useTherapistSearch';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import type { Therapist } from '@/types';

interface RosterSearchProps {
  therapists: Therapist[];
  excludeIds: string[];
  onSelectTherapist: (therapist: Therapist) => void;
}

// Mock specialty and experience data for demonstration


const isTherapistAvailable = (therapist: Therapist): boolean => {
  return therapist.status === 'available' || therapist.status === 'inactive';
};

/**
 * Search component for finding and selecting therapists
 * Handles autocomplete functionality and keyboard navigation
 */
export default function RosterSearch({ 
  therapists, 
  excludeIds, 
  onSelectTherapist 
}: RosterSearchProps) {
  const quickAddRef = React.useRef<HTMLInputElement>(null);
  
  // Filter states
  const [showAvailableOnly, setShowAvailableOnly] = React.useState(false);

  // Use custom hooks for search and keyboard navigation
  const { 
    searchTerm, 
    setSearchTerm, 
    filteredTherapists: baseFilteredTherapists,
    clearSearch 
  } = useTherapistSearch({ 
    therapists, 
    excludeIds 
  });

  // Apply additional filters
  const availableTherapists = baseFilteredTherapists.filter(therapist => {
    const isAvailable = isTherapistAvailable(therapist);
    
    const availabilityMatch = !showAvailableOnly || isAvailable;
    
    return availabilityMatch;
  });

  const showAutocomplete = searchTerm.length > 0 || showAvailableOnly;

  const handleQuickAddSelect = (therapist: Therapist) => {
    onSelectTherapist(therapist);
    clearSearch();
    quickAddRef.current?.focus();
  };

  const { 
    selectedIndex, 
    handleKeyDown, 
    resetSelection 
  } = useKeyboardNavigation({
    items: availableTherapists,
    onSelect: handleQuickAddSelect,
    onEscape: () => {
      resetSelection();
    }
  });

  const handleQuickAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetSelection();
  };

  // Auto-focus quick add input when component mounts
  React.useEffect(() => {
    quickAddRef.current?.focus();
  }, []);


  return (
    <div className="mt-6">
      {/* Search Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white mb-2">Add Therapists to Roster</h2>
        <p className="text-gray-400 text-sm">Search and select therapists for today's roster</p>
      </div>
      
      {/* Simple Filter */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-300">See All</span>
          </label>
        </div>
        <div className="text-sm text-gray-400">
          {availableTherapists.length} therapist{availableTherapists.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={quickAddRef}
          type="text"
          placeholder="Type therapist name to search..."
          value={searchTerm}
          onChange={handleQuickAddChange}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Enhanced Autocomplete Dropdown */}
        {showAutocomplete && availableTherapists.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            {availableTherapists
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((therapist, index) => {
                const isAvailable = isTherapistAvailable(therapist);
                
                return (
                  <button
                    key={therapist.id}
                    onClick={() => handleQuickAddSelect(therapist)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                      index === selectedIndex ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs">
                          {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm truncate">{therapist.name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            isAvailable 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isAvailable ? 'Available' : 'Busy'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {/* No matches message */}
        {showAutocomplete && availableTherapists.length === 0 && searchTerm.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.571M15 6.334A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.571" />
              </svg>
              <span>No therapists found matching "{searchTerm}"</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
