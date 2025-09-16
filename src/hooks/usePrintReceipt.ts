import { useCallback } from 'react';
import { printNodeService } from '@/services/printNodeService';
import { useToast } from '@/hooks/useToast';
import type { Session, Therapist, Room } from '@/types';

export interface UsePrintReceiptReturn {
  printReceipt: (session: Session, therapists: Therapist[], room: Room) => Promise<void>;
  printDepartureSummary: (therapist: Therapist, checkInTime: Date, departureTime: Date, workingHours: number, totalExpenses: number, netPayout: number) => Promise<void>;
  testPrintConnection: () => Promise<void>;
  isPrintNodeConfigured: boolean;
}

export function usePrintReceipt(): UsePrintReceiptReturn {
  const { showToast } = useToast();

  const printReceipt = useCallback(async (session: Session, therapists: Therapist[], room: Room) => {
    try {
      if (!printNodeService.isConfigured()) {
        showToast('PrintNode not configured. Please check your settings.', 'warning');
        return;
      }

      await printNodeService.printReceipt(session, therapists, room);
      
      // Show success message with copy count
      const copyCount = session.service.category === 'Double' ? 4 : 2;
      showToast(`${copyCount} receipt copies sent to printer successfully!`, 'success');
    } catch (error) {
      console.error('Print receipt error:', error);
      showToast(`Failed to print receipt: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [showToast]);

  const printDepartureSummary = useCallback(async (therapist: Therapist, checkInTime: Date, departureTime: Date, workingHours: number, totalExpenses: number, netPayout: number) => {
    try {
      if (!printNodeService.isConfigured()) {
        showToast('PrintNode not configured. Please check your settings.', 'warning');
        return;
      }

      await printNodeService.printDepartureSummary(therapist, checkInTime, departureTime, workingHours, totalExpenses, netPayout);
      
      showToast(`Departure summary for ${therapist.name} sent to printer successfully!`, 'success');
    } catch (error) {
      console.error('Print departure summary error:', error);
      showToast(`Failed to print departure summary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [showToast]);

  const testPrintConnection = useCallback(async () => {
    try {
      if (!printNodeService.isConfigured()) {
        showToast('PrintNode not configured. Please check your settings.', 'warning');
        return;
      }

      await printNodeService.testConnection();
      showToast('PrintNode connection test successful!', 'success');
    } catch (error) {
      console.error('PrintNode connection test error:', error);
      showToast(`PrintNode connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [showToast]);

  return {
    printReceipt,
    printDepartureSummary,
    testPrintConnection,
    isPrintNodeConfigured: printNodeService.isConfigured()
  };
}
