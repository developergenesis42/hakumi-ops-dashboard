import * as React from 'react';
import { useApp } from '@/hooks/useApp';
// import UndoWarningModal from '@/components/UndoWarningModal';

export function useUndoWithWarning() {
  const { state, dispatch } = useApp();
  const [isWarningModalOpen, setIsWarningModalOpen] = React.useState(false);
  const [pendingUndoAction, setPendingUndoAction] = React.useState<(() => void) | null>(null);

  const canUndo = state.undoStack.length > 0;
  const lastAction = state.undoStack.length > 0 ? state.undoStack[state.undoStack.length - 1] : null;
  const lastActionModifiesDatabase = lastAction?.modifiesDatabase || false;
  const lastActionDescription = lastAction?.actionDescription || '';

  const handleUndo = React.useCallback(() => {
    if (!canUndo) return;

    if (lastActionModifiesDatabase) {
      // Show warning modal for database actions
      setPendingUndoAction(() => () => {
        dispatch({ type: 'UNDO_LAST_ACTION' });
        setIsWarningModalOpen(false);
        setPendingUndoAction(null);
      });
      setIsWarningModalOpen(true);
    } else {
      // Safe to undo directly for non-database actions
      dispatch({ type: 'UNDO_LAST_ACTION' });
    }
  }, [canUndo, lastActionModifiesDatabase, dispatch]);

  const handleConfirmUndo = React.useCallback(() => {
    if (pendingUndoAction) {
      pendingUndoAction();
    }
  }, [pendingUndoAction]);

  const handleCloseWarning = React.useCallback(() => {
    setIsWarningModalOpen(false);
    setPendingUndoAction(null);
  }, []);

  return {
    canUndo,
    lastActionModifiesDatabase,
    lastActionDescription,
    handleUndo,
    isWarningModalOpen,
    handleCloseWarning,
    handleConfirmUndo
  };
}