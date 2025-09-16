import { useReducer, useCallback } from 'react';
import type { Therapist, Expense } from '@/types';
import { useAttendance } from '@/hooks/useAttendance';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';
import { useManualTimerStart } from '@/hooks/useManualTimerStart';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useApp } from '@/hooks/useApp';
import { debugLog } from '@/config/environment';

interface ModalState {
  isSessionModalOpen: boolean;
  isManualAddModalOpen: boolean;
  isDepartureModalOpen: boolean;
  isRemoveModalOpen: boolean;
  isExpenseModalOpen: boolean;
}

type ModalAction =
  | { type: 'OPEN_SESSION_MODAL' }
  | { type: 'CLOSE_SESSION_MODAL' }
  | { type: 'OPEN_MANUAL_ADD_MODAL' }
  | { type: 'CLOSE_MANUAL_ADD_MODAL' }
  | { type: 'OPEN_DEPARTURE_MODAL' }
  | { type: 'CLOSE_DEPARTURE_MODAL' }
  | { type: 'OPEN_REMOVE_MODAL' }
  | { type: 'CLOSE_REMOVE_MODAL' }
  | { type: 'OPEN_EXPENSE_MODAL' }
  | { type: 'CLOSE_EXPENSE_MODAL' }
  | { type: 'CLOSE_ALL_MODALS' };

const initialModalState: ModalState = {
  isSessionModalOpen: false,
  isManualAddModalOpen: false,
  isDepartureModalOpen: false,
  isRemoveModalOpen: false,
  isExpenseModalOpen: false,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_SESSION_MODAL':
      return { ...initialModalState, isSessionModalOpen: true };
    case 'CLOSE_SESSION_MODAL':
      return { ...state, isSessionModalOpen: false };
    case 'OPEN_MANUAL_ADD_MODAL':
      return { ...initialModalState, isManualAddModalOpen: true };
    case 'CLOSE_MANUAL_ADD_MODAL':
      return { ...state, isManualAddModalOpen: false };
    case 'OPEN_DEPARTURE_MODAL':
      return { ...initialModalState, isDepartureModalOpen: true };
    case 'CLOSE_DEPARTURE_MODAL':
      return { ...state, isDepartureModalOpen: false };
    case 'OPEN_REMOVE_MODAL':
      return { ...initialModalState, isRemoveModalOpen: true };
    case 'CLOSE_REMOVE_MODAL':
      return { ...state, isRemoveModalOpen: false };
    case 'OPEN_EXPENSE_MODAL':
      return { ...initialModalState, isExpenseModalOpen: true };
    case 'CLOSE_EXPENSE_MODAL':
      return { ...state, isExpenseModalOpen: false };
    case 'CLOSE_ALL_MODALS':
      return initialModalState;
    default:
      return state;
  }
}

export function useTherapistSessionManagement(therapist: Therapist) {
  const [modalState, modalDispatch] = useReducer(modalReducer, initialModalState);

  const { checkInTherapist } = useAttendance();
  const { completeSession } = useSessionCompletion();
  const { startSessionTimer } = useManualTimerStart();
  const { handleError } = useErrorHandler();
  const { dispatch } = useApp();

  const handleStartSession = useCallback(() => {
    modalDispatch({ type: 'OPEN_SESSION_MODAL' });
  }, []);

  const handleManualAdd = useCallback(() => {
    modalDispatch({ type: 'OPEN_MANUAL_ADD_MODAL' });
  }, []);

  const handleCheckIn = useCallback(async () => {
    debugLog('🖱️ Check In button clicked for therapist:', therapist.name, 'ID:', therapist.id);
    debugLog('📊 Current therapist status:', therapist.status);
    try {
      await checkInTherapist(therapist.id, therapist.name);
    } catch (error) {
      console.error('❌ Error in handleCheckIn:', error);
      handleError(error, 'Check in therapist', {
        fallbackMessage: 'Failed to check in therapist'
      });
    }
  }, [checkInTherapist, therapist.id, therapist.name, therapist.status, handleError]);

  const handleStartTimer = useCallback(async () => {
    if (therapist.currentSession && 'id' in therapist.currentSession) {
      try {
        await startSessionTimer(therapist.currentSession.id);
      } catch (error) {
        handleError(error, 'Start session timer', {
          fallbackMessage: 'Failed to start session timer'
        });
      }
    }
  }, [startSessionTimer, therapist.currentSession, handleError]);

  const handleCompleteSession = useCallback(async () => {
    if (therapist.currentSession && 'id' in therapist.currentSession) {
      try {
        await completeSession(therapist.currentSession.id);
      } catch (error) {
        handleError(error, 'Complete session', {
          fallbackMessage: 'Failed to complete session'
        });
      }
    }
  }, [completeSession, therapist.currentSession, handleError]);

  const handleDepart = useCallback(() => {
    modalDispatch({ type: 'OPEN_DEPARTURE_MODAL' });
  }, []);

  const handleRemove = useCallback(() => {
    modalDispatch({ type: 'OPEN_REMOVE_MODAL' });
  }, []);

  const handleExpense = useCallback(() => {
    modalDispatch({ type: 'OPEN_EXPENSE_MODAL' });
  }, []);

  const handleAddExpense = useCallback((therapistId: string, expense: Expense) => {
    dispatch({
      type: 'ADD_EXPENSE',
      payload: { therapistId, expense }
    });
  }, [dispatch]);

  // Modal setters
  const setIsSessionModalOpen = useCallback((isOpen: boolean) => {
    modalDispatch(isOpen ? { type: 'OPEN_SESSION_MODAL' } : { type: 'CLOSE_SESSION_MODAL' });
  }, []);

  const setIsManualAddModalOpen = useCallback((isOpen: boolean) => {
    modalDispatch(isOpen ? { type: 'OPEN_MANUAL_ADD_MODAL' } : { type: 'CLOSE_MANUAL_ADD_MODAL' });
  }, []);

  const setIsDepartureModalOpen = useCallback((isOpen: boolean) => {
    modalDispatch(isOpen ? { type: 'OPEN_DEPARTURE_MODAL' } : { type: 'CLOSE_DEPARTURE_MODAL' });
  }, []);

  const setIsRemoveModalOpen = useCallback((isOpen: boolean) => {
    modalDispatch(isOpen ? { type: 'OPEN_REMOVE_MODAL' } : { type: 'CLOSE_REMOVE_MODAL' });
  }, []);

  const setIsExpenseModalOpen = useCallback((isOpen: boolean) => {
    modalDispatch(isOpen ? { type: 'OPEN_EXPENSE_MODAL' } : { type: 'CLOSE_EXPENSE_MODAL' });
  }, []);

  return {
    // Modal states
    isSessionModalOpen: modalState.isSessionModalOpen,
    isManualAddModalOpen: modalState.isManualAddModalOpen,
    isDepartureModalOpen: modalState.isDepartureModalOpen,
    isRemoveModalOpen: modalState.isRemoveModalOpen,
    isExpenseModalOpen: modalState.isExpenseModalOpen,
    
    // Modal setters
    setIsSessionModalOpen,
    setIsManualAddModalOpen,
    setIsDepartureModalOpen,
    setIsRemoveModalOpen,
    setIsExpenseModalOpen,
    
    // Action handlers
    handleStartSession,
    handleStartTimer,
    handleManualAdd,
    handleCheckIn,
    handleCompleteSession,
    handleDepart,
    handleRemove,
    handleExpense,
    handleAddExpense,
  };
}
