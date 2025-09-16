// Mock LazyComponents for tests
import React from 'react';

export const SessionModal = ({ isOpen, therapist, onClose }: { isOpen: boolean; therapist: any; onClose: () => void }) => 
  isOpen ? <div data-testid="session-modal">Session Modal for {therapist?.name}</div> : null;

export const DepartureModal = ({ isOpen, therapist, onClose }: { isOpen: boolean; therapist: any; onClose: () => void }) => 
  isOpen ? <div data-testid="departure-modal">Departure Modal for {therapist?.name}</div> : null;

export const ExpenseModal = ({ isOpen, therapist, onClose }: { isOpen: boolean; therapist: any; onClose: () => void }) => 
  isOpen ? <div data-testid="expense-modal">Expense Modal for {therapist?.name}</div> : null;

export const EditSessionModal = ({ isOpen, session, onClose }: { isOpen: boolean; session: any; onClose: () => void }) => 
  isOpen ? <div data-testid="edit-session-modal">Edit Session Modal for {session?.id}</div> : null;

export const RemoveStaffModal = ({ isOpen, therapist, onClose }: { isOpen: boolean; therapist: any; onClose: () => void }) => 
  isOpen ? <div data-testid="remove-staff-modal">Remove Staff Modal for {therapist?.name}</div> : null;

export const AddStaffModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
  isOpen ? <div data-testid="add-staff-modal">Add Staff Modal</div> : null;

export const UndoWarningModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => 
  isOpen ? <div data-testid="undo-warning-modal">Undo Warning Modal</div> : null;

export const ExpensesSummaryModal = ({ isOpen, onClose, therapists }: { isOpen: boolean; onClose: () => void; therapists: any[] }) => 
  isOpen ? <div data-testid="expenses-summary-modal">Expenses Summary Modal</div> : null;

export default {
  SessionModal,
  DepartureModal,
  ExpenseModal,
  EditSessionModal,
  RemoveStaffModal,
  AddStaffModal,
  UndoWarningModal,
  ExpensesSummaryModal,
};
