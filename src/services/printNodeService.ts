import type { Session, Therapist, Room } from '@/types';
import { debugLog } from '@/config/environment';
import { lazyLoadPDFDependencies } from '@/utils/lazyDependencies';

interface PrintNodeCredentials {
  apiKey: string;
  printerId: string;
}


class PrintNodeService {
  private credentials: PrintNodeCredentials | null = null;
  private baseUrl = 'https://api.printnode.com';

  constructor() {
    // Load credentials from environment variables
    this.loadCredentials();
  }

  private loadCredentials() {
    const apiKey = import.meta.env.VITE_PRINTNODE_API_KEY;
    const printerId = import.meta.env.VITE_PRINTNODE_PRINTER_ID;
    
    if (apiKey && printerId) {
      this.credentials = { apiKey, printerId };
    } else {
      console.warn('PrintNode credentials not found in environment variables');
    }
  }

  /**
   * Set credentials programmatically (alternative to env vars)
   */
  setCredentials(apiKey: string, printerId: string) {
    this.credentials = { apiKey, printerId };
  }

  /**
   * Check if PrintNode is properly configured
   */
  isConfigured(): boolean {
    return this.credentials !== null;
  }

  /**
   * Round time up to the nearest 5-minute interval
   */
  private roundTimeUp(date: Date): Date {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    
    if (roundedMinutes === 60) {
      // If we rounded to 60 minutes, move to next hour
      const roundedDate = new Date(date);
      roundedDate.setHours(date.getHours() + 1, 0, 0, 0);
      return roundedDate;
    } else {
      // Round to the nearest 5-minute interval
      const roundedDate = new Date(date);
      roundedDate.setMinutes(roundedMinutes, 0, 0);
      return roundedDate;
    }
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  /**
   * Generate PDF for therapist departure summary
   */
  async generateDepartureSummaryPDF(therapist: Therapist, checkInTime: Date, departureTime: Date, workingHours: number, totalExpenses: number, netPayout: number): Promise<string> {
    const { jsPDF } = await lazyLoadPDFDependencies();
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // 80mm width thermal printer format
    });

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HAKUMI NURU MASSAGE', 40, 10, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Daily Summary', 40, 18, { align: 'center' });
    
    // Line separator
    doc.line(5, 22, 75, 22);

    // Therapist name - LARGE FONT
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Therapist: ${therapist.name}`, 40, 30, { align: 'center' });
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${departureTime.toLocaleDateString('th-TH')}`, 5, 38);
    
    // Line separator
    doc.line(5, 42, 75, 42);

    // Time details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('WORKING HOURS', 5, 50);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Check-in: ${this.formatTime(checkInTime)}`, 5, 56);
    doc.text(`Check-out: ${this.formatTime(departureTime)}`, 5, 62);
    
    // Working hours - LARGE FONT
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const hours = Math.floor(workingHours / 60);
    const minutes = workingHours % 60;
    const workingHoursFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    doc.text(`Total: ${workingHoursFormatted} hours`, 5, 70);
    
    // Line separator
    doc.line(5, 76, 75, 76);

    // Session details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SESSIONS & EARNINGS', 5, 84);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sessions: ${therapist.totalSessions}`, 5, 90);
    doc.text(`Earnings: ${therapist.totalEarnings.toLocaleString()} THB`, 5, 96);
    
    // Expenses (if any)
    if (totalExpenses > 0) {
      doc.text(`Expenses: -${totalExpenses.toLocaleString()} THB`, 5, 102);
    }
    
    // Line separator
    doc.line(5, 108, 75, 108);

    // Final payout - LARGE FONT
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FINAL PAYOUT', 40, 118, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(`${netPayout.toLocaleString()} THB`, 40, 128, { align: 'center' });
    
    if (totalExpenses > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`(After deducting ${totalExpenses.toLocaleString()} THB expenses)`, 40, 134, { align: 'center' });
    }

    // Line separator
    doc.line(5, 140, 75, 140);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your work today!', 40, 148, { align: 'center' });
    doc.text(`Generated: ${departureTime.toLocaleString('th-TH')}`, 40, 154, { align: 'center' });
    
    // Return PDF as base64 string
    return doc.output('datauristring');
  }

  /**
   * Generate PDF receipt for a session
   */
  async generateReceiptPDF(session: Session, therapists: Therapist[], room: Room): Promise<string> {
    const { jsPDF } = await lazyLoadPDFDependencies();
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // 80mm width thermal printer format
    });

    // Set font
    doc.setFont('helvetica');

    // Calculate rounded times
    const actualStartTime = new Date(session.startTime);
    const roundedStartTime = this.roundTimeUp(actualStartTime);
    const roundedEndTime = new Date(roundedStartTime.getTime() + session.service.duration * 60000);

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HAKUMI NURU MASSAGE', 40, 10, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Receipt', 40, 18, { align: 'center' });
    
    // Line separator
    doc.line(5, 22, 75, 22);

    // Session details
    doc.setFontSize(9);
    doc.text(`Session ID: ${session.id}`, 5, 28);
    doc.text(`Date: ${actualStartTime.toLocaleDateString('th-TH')}`, 5, 32);
    
    // Start time - LARGER FONT
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Start Time: ${this.formatTime(roundedStartTime)}`, 5, 38);
    
    // End time - LARGER FONT
    doc.text(`End Time: ${this.formatTime(roundedEndTime)}`, 5, 44);
    
    // Room info - LARGER FONT
    doc.text(`Room: ${room.name} (${room.type})`, 5, 50);
    
    // Therapist info - LARGER FONT
    const therapistNames = therapists.map(t => t.name).join(', ');
    doc.text(`Therapist(s): ${therapistNames}`, 5, 56);
    
    // Service details - LARGER FONT
    doc.text(`Service: ${session.service.description.replace(/\bSingle\s+/g, '').replace(/\bDouble\s+/g, '')}`, 5, 62);
    
    // Line separator
    doc.line(5, 68, 75, 68);
    
    // Simplified pricing - just show total if no discount, or breakdown if discount
    if (session.discount > 0) {
      // Show breakdown when there's a discount
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PRICING BREAKDOWN', 5, 76);
      doc.setFont('helvetica', 'normal');
      doc.text(`Service Price: ${session.service.price.toLocaleString()} THB`, 5, 82);
      doc.text(`Discount: -${session.discount.toLocaleString()} THB`, 5, 86);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: ${session.totalPrice.toLocaleString()} THB`, 5, 92);
    } else {
      // Just show total when no discount
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: ${session.totalPrice.toLocaleString()} THB`, 5, 76);
    }
    
    // Payout info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const payoutY = session.discount > 0 ? 98 : 82;
    doc.text(`Lady Payout: ${session.service.ladyPayout.toLocaleString()} THB`, 5, payoutY);
    
    // Calculate adjusted shop revenue (shop revenue minus discount)
    const adjustedShopRevenue = Math.max(0, session.service.shopRevenue - session.discount);
    doc.text(`Shop Revenue: ${adjustedShopRevenue.toLocaleString()} THB`, 5, payoutY + 4);
    
    // Return PDF as base64 string
    return doc.output('datauristring');
  }

  /**
   * Get number of copies to print based on session type
   */
  private getPrintCopies(session: Session): number {
    switch (session.service.category) {
      case 'Single':
        return 2; // Single lady session - 2 copies
      case 'Double':
        return 4; // Double lady session - 4 copies
      case 'Couple':
        return 2; // Couple session - 2 copies
      default:
        return 1; // Fallback to 1 copy
    }
  }

  /**
   * Print departure summary for a therapist
   */
  async printDepartureSummary(therapist: Therapist, checkInTime: Date, departureTime: Date, workingHours: number, totalExpenses: number, netPayout: number): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('PrintNode credentials not configured');
    }

    try {
      // Generate PDF
      const pdfDataUri = await this.generateDepartureSummaryPDF(therapist, checkInTime, departureTime, workingHours, totalExpenses, netPayout);
      const base64Content = pdfDataUri.split(',')[1]; // Remove data:application/pdf;base64, prefix

      // Create print job for departure summary (2 copies)
      const printJob = {
        printerId: this.credentials.printerId,
        title: `Departure Summary - ${therapist.name}`,
        contentType: 'pdf_base64',
        content: base64Content,
        source: 'spa-ops-dashboard'
      };

      // Send print job to PrintNode API
      const response = await fetch(`${this.baseUrl}/printjobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.credentials.apiKey + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printJob)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PrintNode API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      debugLog(`Departure summary print job submitted successfully for ${therapist.name}`, result);
      return true;

    } catch (error) {
      console.error('Failed to print departure summary:', error);
      throw error;
    }
  }

  /**
   * Send print job to PrintNode with multiple copies
   */
  async printReceipt(session: Session, therapists: Therapist[], room: Room): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('PrintNode credentials not configured');
    }

    try {
      // Generate PDF
      const pdfDataUri = await this.generateReceiptPDF(session, therapists, room);
      const base64Content = pdfDataUri.split(',')[1]; // Remove data:application/pdf;base64, prefix

      // Get number of copies based on session type
      const copies = this.getPrintCopies(session);

      // Create print jobs for each copy
      const printJobs = Array.from({ length: copies }, (_, index) => ({
        printerId: this.credentials!.printerId,
        title: `Session Receipt - ${session.id} (Copy ${index + 1}/${copies})`,
        contentType: 'pdf_base64',
        content: base64Content,
        source: 'spa-ops-dashboard'
      }));

      // Send all print jobs to PrintNode API
      const printPromises = printJobs.map(printJob => 
        fetch(`${this.baseUrl}/printjobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(this.credentials!.apiKey + ':')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(printJob)
        })
      );

      const responses = await Promise.all(printPromises);

      // Check if all print jobs were successful
      const failedJobs = responses.filter(response => !response.ok);
      if (failedJobs.length > 0) {
        const errorData = await failedJobs[0].json();
        throw new Error(`PrintNode API error: ${errorData.message || failedJobs[0].statusText}`);
      }

      const results = await Promise.all(responses.map(response => response.json()));
      debugLog(`Print job submitted successfully: ${copies} copies printed`, results);
      return true;

    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }

  /**
   * Test PrintNode connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('PrintNode credentials not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/printers`, {
        headers: {
          'Authorization': `Basic ${btoa(this.credentials.apiKey + ':')}`
        }
      });

      if (!response.ok) {
        throw new Error(`PrintNode API error: ${response.statusText}`);
      }

      const printers = await response.json();
      const targetPrinter = printers.find((p: { id: string | number; [key: string]: unknown }) => 
        p.id === this.credentials!.printerId || p.id === parseInt(this.credentials!.printerId)
      );
      
      if (!targetPrinter) {
        throw new Error(`Printer with ID ${this.credentials.printerId} not found`);
      }

      debugLog('PrintNode connection successful. Printer status:', targetPrinter.state);
      return true;

    } catch (error) {
      console.error('PrintNode connection test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const printNodeService = new PrintNodeService();
