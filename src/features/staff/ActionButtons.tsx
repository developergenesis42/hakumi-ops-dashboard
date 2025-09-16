import React from 'react';
import type { Therapist } from '@/types';

interface ActionButtonsProps {
  therapist: Therapist;
  onStartSession: () => void;
  onStartTimer?: () => void;
  onManualAdd: () => void;
  onCheckIn: () => void;
  onCompleteSession: () => void;
  onDepart: () => void;
  onExpense: () => void;
}

function ActionButtons({
  therapist,
  onStartSession,
  onStartTimer,
  onManualAdd,
  onCheckIn,
  onCompleteSession,
  onDepart,
  onExpense,
}: ActionButtonsProps) {
  const getButtonStyle = (baseColor: string, hoverColor: string) => ({
    background: `linear-gradient(135deg, ${baseColor} 0%, ${hoverColor} 100%)`,
    boxShadow: `0 4px 14px 0 ${baseColor.replace('0.3', '0.1')}, 0 0 0 1px ${baseColor.replace('0.3', '0.1')}`,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  });

  if (therapist.status === 'inactive') {
    return (
      <button
        onClick={onCheckIn}
        className="flex-1 px-3 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-400/40 font-medium border border-green-300 text-center"
        style={getButtonStyle('rgba(74, 222, 128, 0.3)', 'rgba(34, 197, 94, 0.3)')}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Check In</span>
        </div>
      </button>
    );
  }

  if (therapist.status === 'available') {
    return (
      <div className="w-full">
        {/* Top row - Primary actions */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={onStartSession}
            className="flex-1 px-3 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-400/40 font-medium border border-green-300 text-center"
            style={getButtonStyle('rgba(74, 222, 128, 0.3)', 'rgba(34, 197, 94, 0.3)')}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Save</span>
            </div>
          </button>
          
          <button
            onClick={onManualAdd}
            className="flex-1 px-3 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-gray-500/30 font-medium border border-gray-400 text-center"
            style={getButtonStyle('rgba(107, 114, 128, 0.3)', 'rgba(75, 85, 99, 0.3)')}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add</span>
            </div>
          </button>
        </div>
        
        {/* Bottom row - Secondary actions */}
        <div className="flex gap-2">
          <button
            onClick={onExpense}
            className="flex-1 px-3 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-yellow-500/30 font-medium border border-yellow-400 text-center"
            style={getButtonStyle('rgba(234, 179, 8, 0.3)', 'rgba(202, 138, 4, 0.3)')}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Expense</span>
            </div>
          </button>
          
          <button
            onClick={onDepart}
            className="flex-1 px-3 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30 font-medium border border-red-400 text-center"
            style={getButtonStyle('rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.3)')}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Leave</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (therapist.status === 'in-session') {
    // Check if session is in prep phase
    const isInPrepPhase = therapist.currentSession && 'isInPrepPhase' in therapist.currentSession && therapist.currentSession.isInPrepPhase;
    
    if (isInPrepPhase && onStartTimer) {
      return (
        <button
          onClick={onStartTimer}
          className="flex-1 px-3 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/30 font-medium border border-orange-400 text-center"
          style={getButtonStyle('rgba(249, 115, 22, 0.3)', 'rgba(234, 88, 12, 0.3)')}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Timer</span>
          </div>
        </button>
      );
    }
    
    return (
      <button
        onClick={onCompleteSession}
        className="flex-1 px-3 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30 font-medium border border-blue-400 text-center"
        style={getButtonStyle('rgba(59, 130, 246, 0.3)', 'rgba(37, 99, 235, 0.3)')}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Complete</span>
        </div>
      </button>
    );
  }

  // Departed status
  return (
    <div className="flex-1 px-3 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg flex items-center justify-center gap-2 shadow-lg font-medium border border-gray-400 text-center"
      style={getButtonStyle('rgba(107, 114, 128, 0.3)', 'rgba(75, 85, 99, 0.3)')}
    >
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Departed</span>
      </div>
    </div>
  );
}

export default React.memo(ActionButtons);
