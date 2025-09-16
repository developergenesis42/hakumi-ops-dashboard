import * as React from 'react';

interface UndoWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionDescription: string;
}

export default function UndoWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  actionDescription 
}: UndoWarningModalProps) {
  const [isConfirmed, setIsConfirmed] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setIsConfirmed(false);
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 modal-content">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Undo Database Action</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-3">
            You're about to undo: <span className="font-medium text-yellow-400">{actionDescription}</span>
          </p>
          
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-yellow-200 text-sm font-medium mb-1">Important Warning:</p>
                <p className="text-yellow-100 text-sm">
                  This action only affects your current session. The database will NOT be updated, 
                  so this change will be restored when you refresh the page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="confirm-undo"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="confirm-undo" className="text-sm text-gray-300">
              I understand that this undo will only affect the current session and data will be restored on page refresh
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Undo Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
