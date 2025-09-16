import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { useToast } from '@/hooks/useToast';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { debugLog } from '@/config/environment';
import { sessionService } from '@/services/sessionService';
import type { Service, Room, Therapist } from '@/types';
import { getAvailableRoomsByType, getAvailableTherapists, generateId } from '@/utils/helpers';

export type ModalStep = 'service-category' | 'service-package' | 'therapist2' | 'room-select' | 'discount' | 'time-select' | 'confirm';

export interface SessionModalState {
  currentStep: ModalStep;
  selectedServiceCategory: 'Single' | 'Double' | 'Couple' | null;
  selectedService: Service | null;
  selectedRoom: Room | null;
  selectedTherapist2: Therapist | null;
  discount: number;
  startTime: Date;
  endTime: Date;
  isSubmitting: boolean;
}

export type SessionModalAction =
  | { type: 'SET_CURRENT_STEP'; payload: ModalStep }
  | { type: 'SET_SERVICE_CATEGORY'; payload: 'Single' | 'Double' | 'Couple' | null }
  | { type: 'SET_SERVICE'; payload: Service | null }
  | { type: 'SET_ROOM'; payload: Room | null }
  | { type: 'SET_THERAPIST2'; payload: Therapist | null }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'SET_START_TIME'; payload: Date }
  | { type: 'SET_END_TIME'; payload: Date }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_MODAL' }
  | { type: 'HANDLE_NEXT' }
  | { type: 'HANDLE_BACK' };

export interface SessionModalActions {
  setCurrentStep: (step: ModalStep) => void;
  setSelectedServiceCategory: (category: 'Single' | 'Double' | 'Couple' | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedRoom: (room: Room | null) => void;
  setSelectedTherapist2: (therapist: Therapist | null) => void;
  setDiscount: (discount: number) => void;
  setStartTime: (time: Date) => void;
  setEndTime: (time: Date) => void;
  handleNext: () => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  resetModal: () => void;
}

export interface SessionModalComputed {
  availableRooms: Room[];
  availableTherapists: Therapist[];
  totalPrice: number;
  canProceed: boolean;
}

const initialState: SessionModalState = {
  currentStep: 'service-category',
  selectedServiceCategory: null,
  selectedService: null,
  selectedRoom: null,
  selectedTherapist2: null,
  discount: 0,
  startTime: new Date(),
  endTime: new Date(),
  isSubmitting: false,
};

function sessionModalReducer(state: SessionModalState, action: SessionModalAction): SessionModalState {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SERVICE_CATEGORY':
      return { ...state, selectedServiceCategory: action.payload };
    case 'SET_SERVICE':
      return { ...state, selectedService: action.payload };
    case 'SET_ROOM':
      return { ...state, selectedRoom: action.payload };
    case 'SET_THERAPIST2':
      return { ...state, selectedTherapist2: action.payload };
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };
    case 'SET_START_TIME':
      return { ...state, startTime: action.payload };
    case 'SET_END_TIME':
      return { ...state, endTime: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'RESET_MODAL':
      return initialState;
    case 'HANDLE_NEXT':
      return handleNextStep(state);
    case 'HANDLE_BACK':
      return handleBackStep(state);
    default:
      return state;
  }
}

function handleNextStep(state: SessionModalState): SessionModalState {
  switch (state.currentStep) {
    case 'service-category':
      if (state.selectedServiceCategory) {
        return { ...state, currentStep: 'service-package' };
      }
      return state;
    case 'service-package':
      if (state.selectedService) {
        if (state.selectedService.category === 'Double') {
          return { ...state, currentStep: 'therapist2' };
        } else {
          return { ...state, currentStep: 'room-select' };
        }
      }
      return state;
    case 'therapist2':
      if (state.selectedTherapist2 || state.selectedService?.category !== 'Double') {
        return { ...state, currentStep: 'room-select' };
      }
      return state;
    case 'room-select':
      if (state.selectedRoom) {
        return { ...state, currentStep: 'discount' };
      }
      return state;
    case 'discount':
      // For manual add, go to time selection, otherwise go to confirm
      return { ...state, currentStep: 'time-select' };
    case 'time-select':
      return { ...state, currentStep: 'confirm' };
    default:
      return state;
  }
}

function handleBackStep(state: SessionModalState): SessionModalState {
  switch (state.currentStep) {
    case 'service-package':
      return { ...state, currentStep: 'service-category' };
    case 'therapist2':
      return { ...state, currentStep: 'service-package' };
    case 'room-select':
      if (state.selectedService?.category === 'Double') {
        return { ...state, currentStep: 'therapist2' };
      } else {
        return { ...state, currentStep: 'service-package' };
      }
    case 'discount':
      return { ...state, currentStep: 'room-select' };
    case 'time-select':
      return { ...state, currentStep: 'discount' };
    case 'confirm':
      return { ...state, currentStep: 'time-select' };
    default:
      return state;
  }
}

export function useSessionModal(
  isOpen: boolean,
  onClose: () => void,
  therapist: Therapist,
  isManualAdd: boolean = false
): SessionModalState & SessionModalActions & SessionModalComputed {
  const { state, dispatch } = useApp();
  const { createSession } = useSessionPersistence();
  const { showToast } = useToast();
  const { printReceipt } = usePrintReceipt();

  // Use reducer for complex state management
  const [modalState, modalDispatch] = useReducer(sessionModalReducer, initialState);

  // Computed values
  const availableRooms = useMemo(() => {
    if (!modalState.selectedService) return [];

    // When manually adding a session, allow choosing any room of the right type (ignore current status)
    if (isManualAdd) {
      if (modalState.selectedService.roomType === 'Shower') {
        if (modalState.selectedService.category === 'Single') {
          const showerRoomsAll = state.rooms.filter(room =>
            room.type === 'Shower' || room.type === 'Double Bed Shower (large)' || room.type === 'Single Bed Shower (large)'
          );
          if (showerRoomsAll.length === 0) {
            // Fallback to VIP regardless of status
            return state.rooms.filter(room => room.type === 'VIP Jacuzzi');
          }
          return showerRoomsAll;
        } else if (modalState.selectedService.category === 'Double') {
          return state.rooms.filter(room =>
            room.type === 'Double Bed Shower (large)' ||
            room.type === 'Single Bed Shower (large)' ||
            room.type === 'VIP Jacuzzi'
          );
        }
      }
      // Default: match by type only
      return state.rooms.filter(room => room.type === modalState.selectedService!.roomType);
    }

    // Normal flow: only available rooms
    if (modalState.selectedService.roomType === 'Shower') {
      if (modalState.selectedService.category === 'Single') {
        const showerRooms = state.rooms.filter(room =>
          room.status === 'available' &&
          (room.type === 'Shower' || room.type === 'Double Bed Shower (large)' || room.type === 'Single Bed Shower (large)')
        );
        if (showerRooms.length === 0) {
          const vipRooms = state.rooms.filter(room => room.status === 'available' && room.type === 'VIP Jacuzzi');
          return vipRooms;
        }
        return showerRooms;
      } else if (modalState.selectedService.category === 'Double') {
        return state.rooms.filter(room =>
          room.status === 'available' &&
          (room.type === 'Double Bed Shower (large)' || room.type === 'Single Bed Shower (large)' || room.type === 'VIP Jacuzzi')
        );
      }
    }
    return getAvailableRoomsByType(state.rooms, modalState.selectedService.roomType);
  }, [modalState.selectedService, state.rooms, isManualAdd]);

  const availableTherapists = useMemo(() => {
    return getAvailableTherapists(state.todayRoster).filter(t => t.id !== therapist.id);
  }, [state.todayRoster, therapist.id]);

  const totalPrice = useMemo(() => {
    return modalState.selectedService ? modalState.selectedService.price - modalState.discount : 0;
  }, [modalState.selectedService, modalState.discount]);

  const canProceed = useMemo(() => {
    switch (modalState.currentStep) {
      case 'service-category':
        return modalState.selectedServiceCategory !== null;
      case 'service-package':
        return modalState.selectedService !== null;
      case 'therapist2':
        return modalState.selectedService?.category !== 'Double' || modalState.selectedTherapist2 !== null;
      case 'room-select':
        return modalState.selectedRoom !== null;
      case 'discount':
        return true; // Discount is optional
      case 'time-select':
        return modalState.startTime < modalState.endTime; // Start time must be before end time
      case 'confirm':
        return true;
      default:
        return false;
    }
  }, [modalState.currentStep, modalState.selectedServiceCategory, modalState.selectedService, modalState.selectedTherapist2, modalState.selectedRoom, modalState.startTime, modalState.endTime]);

  // Actions
  const handleNext = useCallback(() => {
    modalDispatch({ type: 'HANDLE_NEXT' });
  }, []);

  const handleBack = useCallback(() => {
    modalDispatch({ type: 'HANDLE_BACK' });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!modalState.selectedService || !modalState.selectedRoom) return;

    modalDispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const now = new Date();
      const sessionEndTime = new Date(now.getTime() + modalState.selectedService.duration * 60 * 1000);
      
      // Ensure we have valid therapist IDs (must be real UUIDs from database)
      const therapistIds = modalState.selectedService.category === 'Double' && modalState.selectedTherapist2
        ? [therapist.id, modalState.selectedTherapist2.id]
        : [therapist.id];
      
      // Validate that all therapist IDs are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidIds = therapistIds.filter(id => !uuidRegex.test(id));
      
      if (invalidIds.length > 0) {
        console.error('❌ Invalid therapist IDs detected:', invalidIds);
        showToast('Invalid therapist data. Please refresh and try again.', 'error');
        return;
      }
      
      // Debug logging for session creation
      console.log('🔍 DEBUG: Creating session with data:', {
        selectedRoom: modalState.selectedRoom,
        roomId: modalState.selectedRoom.id,
        selectedService: modalState.selectedService,
        serviceId: modalState.selectedService.id,
        therapistIds: therapistIds
      });

      const session = {
        id: generateId(),
        therapistIds: therapistIds,
        service: modalState.selectedService,
        roomId: modalState.selectedRoom.id,
        startTime: isManualAdd ? modalState.startTime : now, // Use custom time for manual add
        endTime: isManualAdd ? modalState.endTime : sessionEndTime, // Use custom time for manual add
        status: isManualAdd ? 'completed' as const : 'scheduled' as const,
        totalPrice,
        discount: modalState.discount,
        actualEndTime: isManualAdd ? modalState.endTime : undefined, // For manual add, actual end time is the end time
        actualDuration: isManualAdd ? Math.round((modalState.endTime.getTime() - modalState.startTime.getTime()) / (1000 * 60)) : undefined,
        sessionStartTime: isManualAdd ? modalState.startTime : undefined, // For manual add, session start time is the start time
        isInPrepPhase: isManualAdd ? false : true, // Manual add sessions are not in prep phase
        prepStartTime: isManualAdd ? modalState.startTime : now
      };

      // Optimistic UI - close modal immediately
      onClose();
      
      if (isManualAdd) {
        // For manual add, save to Supabase first, then update local state
        try {
          const savedSession = await sessionService.createSession(session);
          dispatch({ type: 'MANUAL_ADD_SESSION', payload: savedSession });
          showToast('Session added successfully!', 'success');
        } catch (error) {
          console.error('❌ Manual session creation failed:', error);
          // Still update local state for offline functionality
          dispatch({ type: 'MANUAL_ADD_SESSION', payload: session });
          showToast('Session added locally, but sync to server failed. Will retry when online.', 'warning');
        }
      } else {
        // Create session asynchronously
        createSession(session).catch((error) => {
          console.error('❌ Session creation failed:', error);
          showToast(`Session saved locally, but sync to server failed: ${error.message}`, 'warning');
        });
        showToast('Session saved! Click "Start Timer" when ready.', 'success');
      }

      // Print receipt immediately when session is saved
      try {
        const sessionTherapists = state.todayRoster.filter(t => session.therapistIds.includes(t.id));
        const sessionRoom = state.rooms.find(r => r.id === session.roomId);
        
        if (sessionRoom) {
          await printReceipt(session, sessionTherapists, sessionRoom);
          debugLog('✅ Receipt printed for new session:', session.id);
        }
      } catch (printError) {
        console.warn('Failed to print receipt for new session:', printError);
        // Don't fail session creation if printing fails
      }
    } catch {
      showToast('Failed to save session', 'error');
    } finally {
      modalDispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [modalState.selectedService, modalState.selectedRoom, modalState.selectedTherapist2, modalState.discount, modalState.startTime, modalState.endTime, therapist.id, totalPrice, onClose, createSession, showToast, isManualAdd, dispatch, printReceipt, state.rooms, state.todayRoster]);

  const resetModal = useCallback(() => {
    modalDispatch({ type: 'RESET_MODAL' });
  }, []);

  // Reset modal when it opens and initialize times for manual add
  useEffect(() => {
    if (isOpen) {
      resetModal();
      if (isManualAdd) {
        // Initialize with current time for manual add
        const now = new Date();
        modalDispatch({ type: 'SET_START_TIME', payload: now });
        modalDispatch({ type: 'SET_END_TIME', payload: new Date(now.getTime() + 60 * 60 * 1000) }); // Default 1 hour
      }
    }
  }, [isOpen, resetModal, isManualAdd]);

  // Action creators
  const setCurrentStep = useCallback((step: ModalStep) => {
    modalDispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  const setSelectedServiceCategory = useCallback((category: 'Single' | 'Double' | 'Couple' | null) => {
    modalDispatch({ type: 'SET_SERVICE_CATEGORY', payload: category });
  }, []);

  const setSelectedService = useCallback((service: Service | null) => {
    modalDispatch({ type: 'SET_SERVICE', payload: service });
  }, []);

  const setSelectedRoom = useCallback((room: Room | null) => {
    modalDispatch({ type: 'SET_ROOM', payload: room });
  }, []);

  const setSelectedTherapist2 = useCallback((therapist: Therapist | null) => {
    modalDispatch({ type: 'SET_THERAPIST2', payload: therapist });
  }, []);

  const setDiscount = useCallback((discount: number) => {
    modalDispatch({ type: 'SET_DISCOUNT', payload: discount });
  }, []);

  const setStartTime = useCallback((time: Date) => {
    modalDispatch({ type: 'SET_START_TIME', payload: time });
  }, []);

  const setEndTime = useCallback((time: Date) => {
    modalDispatch({ type: 'SET_END_TIME', payload: time });
  }, []);

  return {
    // State
    currentStep: modalState.currentStep,
    selectedServiceCategory: modalState.selectedServiceCategory,
    selectedService: modalState.selectedService,
    selectedRoom: modalState.selectedRoom,
    selectedTherapist2: modalState.selectedTherapist2,
    discount: modalState.discount,
    startTime: modalState.startTime,
    endTime: modalState.endTime,
    isSubmitting: modalState.isSubmitting,
    
    // Actions
    setCurrentStep,
    setSelectedServiceCategory,
    setSelectedService,
    setSelectedRoom,
    setSelectedTherapist2,
    setDiscount,
    setStartTime,
    setEndTime,
    handleNext,
    handleBack,
    handleSubmit,
    resetModal,
    
    // Computed
    availableRooms,
    availableTherapists,
    totalPrice,
    canProceed
  };
}
