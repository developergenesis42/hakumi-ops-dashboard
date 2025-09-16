import type { Therapist } from '@/types';
import { useApp } from '@/hooks/useApp';
import { useRosterPersistence } from '@/hooks/useRosterPersistence';
import { useTherapistSearch } from '@/hooks/useTherapistSearch';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useFieldValidation } from '@/hooks/useValidation';
import { ValidationRules } from '@/utils/validation';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  const { state } = useApp();
  const { addToRoster } = useRosterPersistence();
  
  // Get available therapists (not already on today's roster)
  const availableTherapists = state.therapists.filter(
    therapist => !state.todayRoster.find(t => t.id === therapist.id)
  );
  
  const { searchTerm, setSearchTerm, filteredTherapists, clearSearch } = useTherapistSearch({ therapists: availableTherapists });
  const { selectedIndex, handleKeyDown } = useKeyboardNavigation({
    items: filteredTherapists,
    onSelect: (therapist) => handleAddStaff(therapist),
    onEscape: onClose
  });

  // Validation for search input
  const searchValidation = useFieldValidation('', ValidationRules.searchTerm);

  if (!isOpen) return null;

  const handleAddStaff = async (therapist: Therapist) => {
    try {
      await addToRoster(therapist);
      clearSearch();
      onClose();
    } catch (error) {
      console.error('Failed to add therapist to roster:', error);
      // Still close the modal even if Supabase save fails
      clearSearch();
      onClose();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    searchValidation.setValue(value);
    setSearchTerm(value);
  };

  const handleKeyDownWithEscape = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else {
      handleKeyDown(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6 modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-4 max-w-md w-full shadow-2xl max-h-[50vh] flex flex-col relative z-50 modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
              title="Go Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Add Staff</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDownWithEscape}
              onBlur={() => searchValidation.setTouched()}
              className={`w-full px-3 py-2 pl-9 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm placeholder-gray-500 ${
                searchValidation.touched && searchValidation.error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              autoFocus
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Validation Error Display */}
            {searchValidation.touched && searchValidation.error && (
              <div className="mt-2 text-sm text-red-600">
                {searchValidation.error}
              </div>
            )}
          </div>
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto max-h-64">
          {filteredTherapists.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm mb-1">
                {searchTerm ? 'No staff found' : 'No available staff'}
              </div>
              <div className="text-gray-400 text-xs">
                {searchTerm ? 'Try a different search term' : 'All staff are already on today\'s roster'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 pr-1">
              {filteredTherapists.map((therapist, index) => (
                <div
                  key={therapist.id}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all duration-200 cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddStaff(therapist);
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium text-gray-900 text-sm truncate w-full mb-1">{therapist.name}</div>
                    <div className="text-xs text-gray-500">
                      {therapist.totalSessions} sessions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {availableTherapists.length} staff available
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
