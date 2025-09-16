import { useState } from 'react';
import type { Therapist } from '@/types';
import { useRosterPersistence } from '@/hooks/useRosterPersistence';

interface RemoveStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
}

export default function RemoveStaffModal({ isOpen, onClose, therapist }: RemoveStaffModalProps) {
  const { removeFromRoster } = useRosterPersistence();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirmRemoval = async () => {
    setIsConfirming(true);
    try {
      await removeFromRoster(therapist.id);
      onClose();
    } catch (error) {
      console.error('Failed to remove therapist from roster:', error);
      // Still close the modal even if database operation fails
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl modal-content">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Remove Staff</h2>
          <p className="text-sm text-gray-600">
            Remove <span className="font-medium text-gray-900">{therapist.name}</span> from today's roster?
          </p>
        </div>

        {/* Staff Information */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">{therapist.name}</div>
              <div className="text-xs text-gray-500">
                Status: <span className="font-medium text-gray-700">Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-5">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-xs text-orange-800">
              <p className="font-medium">Cannot be undone</p>
              <p>They'll need to be added again if they arrive later.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isConfirming}
            className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRemoval}
            disabled={isConfirming}
            className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {isConfirming ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
