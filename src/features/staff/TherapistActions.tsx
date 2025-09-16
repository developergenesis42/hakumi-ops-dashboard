import React from 'react';
import type { Therapist } from '@/types';
import { ActionGroup } from '@/features/roster/ui';

interface TherapistActionsProps {
  therapist: Therapist;
  onStartSession: () => void;
  onStartTimer?: () => void;
  onManualAdd: () => void;
  onCheckIn: () => void;
  onCompleteSession: () => void;
  onDepart: () => void;
  onExpense: () => void;
}

export function TherapistActions({
  therapist,
  onStartSession,
  onStartTimer,
  onManualAdd,
  onCheckIn,
  onCompleteSession,
  onDepart,
  onExpense,
}: TherapistActionsProps) {
  const getActionIcons = () => ({
    checkIn: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    start: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
    ),
    add: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    expense: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    depart: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    complete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  });

  const icons = getActionIcons();

  if (therapist.status === 'inactive') {
    return (
      <ActionGroup layout="horizontal">
        <ActionGroup.Item
          onClick={onCheckIn}
          variant="success"
          icon={icons.checkIn}
          fullWidth
        >
          Check In
        </ActionGroup.Item>
      </ActionGroup>
    );
  }

  if (therapist.status === 'available') {
    return (
      <ActionGroup layout="vertical">
        <ActionGroup layout="horizontal">
          <ActionGroup.Item
            onClick={onStartSession}
            variant="success"
            icon={icons.start}
            fullWidth
          >
            Save
          </ActionGroup.Item>
          <ActionGroup.Item
            onClick={onManualAdd}
            variant="secondary"
            icon={icons.add}
            fullWidth
          >
            Add
          </ActionGroup.Item>
        </ActionGroup>
        <ActionGroup layout="horizontal">
          <ActionGroup.Item
            onClick={onExpense}
            variant="warning"
            icon={icons.expense}
            fullWidth
          >
            Expense
          </ActionGroup.Item>
          <ActionGroup.Item
            onClick={onDepart}
            variant="error"
            icon={icons.depart}
            fullWidth
          >
            Leave
          </ActionGroup.Item>
        </ActionGroup>
      </ActionGroup>
    );
  }

  if (therapist.status === 'in-session') {
    // Check if session is in prep phase
    const isInPrepPhase = therapist.currentSession && 'isInPrepPhase' in therapist.currentSession && therapist.currentSession.isInPrepPhase;
    
    if (isInPrepPhase && onStartTimer) {
      return (
        <ActionGroup layout="horizontal">
          <ActionGroup.Item
            onClick={onStartTimer}
            variant="warning"
            icon={icons.start}
            fullWidth
          >
            Start Timer
          </ActionGroup.Item>
        </ActionGroup>
      );
    }
    
    return (
      <ActionGroup layout="horizontal">
        <ActionGroup.Item
          onClick={onCompleteSession}
          variant="primary"
          icon={icons.complete}
          fullWidth
        >
          Complete
        </ActionGroup.Item>
      </ActionGroup>
    );
  }

  // Departed status
  return (
    <ActionGroup layout="horizontal">
      <ActionGroup.Item
        onClick={() => {}}
        variant="ghost"
        icon={icons.depart}
        fullWidth
        disabled
      >
        Leave Work
      </ActionGroup.Item>
    </ActionGroup>
  );
}

export default React.memo(TherapistActions);
