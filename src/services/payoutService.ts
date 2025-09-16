/**
 * Payout Service
 * Calculates daily payouts and earnings for therapists
 */

import type { Therapist } from '@/types';
import { formatCurrency } from '@/utils/helpers';

export interface PayoutSummary {
  therapistId: string;
  therapistName: string;
  workingHours: number; // in minutes
  workingHoursFormatted: string; // HH:MM format
  totalEarnings: number;
  totalSessions: number;
  averagePerSession: number;
  hourlyRate: number;
  payoutAmount: number;
}

export interface DailyPayoutSummary {
  date: string;
  totalTherapists: number;
  totalWorkingHours: number;
  totalEarnings: number;
  totalPayouts: number;
  averageHourlyRate: number;
  payouts: PayoutSummary[];
}

class PayoutService {
  /**
   * Calculate payout summary for a single therapist
   */
  calculateTherapistPayout(therapist: Therapist, workingHours: number): PayoutSummary {
    const workingHoursFormatted = this.formatWorkingHours(workingHours);
    const averagePerSession = therapist.totalSessions > 0 
      ? therapist.totalEarnings / therapist.totalSessions 
      : 0;
    const hourlyRate = workingHours > 0 
      ? (therapist.totalEarnings / workingHours) * 60 
      : 0;

    return {
      therapistId: therapist.id,
      therapistName: therapist.name,
      workingHours,
      workingHoursFormatted,
      totalEarnings: therapist.totalEarnings,
      totalSessions: therapist.totalSessions,
      averagePerSession,
      hourlyRate,
      payoutAmount: therapist.totalEarnings // Payout amount equals total earnings
    };
  }

  /**
   * Calculate daily payout summary for all therapists
   */
  calculateDailyPayouts(therapists: Therapist[], workingHoursMap: Map<string, number>): DailyPayoutSummary {
    const payouts: PayoutSummary[] = [];
    let totalWorkingHours = 0;
    let totalEarnings = 0;
    let totalPayouts = 0;

    therapists.forEach(therapist => {
      const workingHours = workingHoursMap.get(therapist.id) || 0;
      const payout = this.calculateTherapistPayout(therapist, workingHours);
      
      payouts.push(payout);
      totalWorkingHours += workingHours;
      totalEarnings += therapist.totalEarnings;
      totalPayouts += payout.payoutAmount;
    });

    const averageHourlyRate = totalWorkingHours > 0 
      ? (totalEarnings / totalWorkingHours) * 60 
      : 0;

    return {
      date: new Date().toISOString().split('T')[0],
      totalTherapists: therapists.length,
      totalWorkingHours,
      totalEarnings,
      totalPayouts,
      averageHourlyRate,
      payouts
    };
  }

  /**
   * Format working hours as HH:MM
   */
  private formatWorkingHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Generate payout report for printing/export
   */
  generatePayoutReport(dailySummary: DailyPayoutSummary): string {
    const { date, payouts, totalPayouts, totalWorkingHours } = dailySummary;
    
    let report = `DAILY PAYOUT REPORT - ${new Date(date).toLocaleDateString()}\n`;
    report += `==========================================\n\n`;
    
    // Individual payouts
    payouts.forEach((payout, index) => {
      report += `${index + 1}. ${payout.therapistName}\n`;
      report += `   Working Hours: ${payout.workingHoursFormatted}\n`;
      report += `   Sessions: ${payout.totalSessions}\n`;
      report += `   Earnings: ${formatCurrency(payout.totalEarnings)}\n`;
      report += `   Hourly Rate: ${formatCurrency(payout.hourlyRate)}/hour\n`;
      report += `   PAYOUT: ${formatCurrency(payout.payoutAmount)}\n\n`;
    });
    
    // Summary
    report += `SUMMARY\n`;
    report += `-------\n`;
    report += `Total Therapists: ${dailySummary.totalTherapists}\n`;
    report += `Total Working Hours: ${this.formatWorkingHours(totalWorkingHours)}\n`;
    report += `Total Earnings: ${formatCurrency(dailySummary.totalEarnings)}\n`;
    report += `TOTAL PAYOUTS: ${formatCurrency(totalPayouts)}\n`;
    
    return report;
  }

  /**
   * Calculate commission for management (if applicable)
   */
  calculateCommission(totalEarnings: number, commissionRate: number = 0.1): number {
    return totalEarnings * commissionRate;
  }

  /**
   * Calculate net profit after payouts
   */
  calculateNetProfit(totalRevenue: number, totalPayouts: number, commissionRate: number = 0.1): number {
    const commission = this.calculateCommission(totalRevenue, commissionRate);
    return totalRevenue - totalPayouts - commission;
  }
}

export const payoutService = new PayoutService();
