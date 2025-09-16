
import React from 'react';

interface RemoveButtonProps {
  onRemove: () => void;
}

function RemoveButton({ onRemove }: RemoveButtonProps) {
  return (
    <button
      onClick={onRemove}
      className="w-5 h-5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
      title="Remove from roster"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export default React.memo(RemoveButton);
