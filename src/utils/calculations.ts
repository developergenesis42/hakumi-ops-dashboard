import type { Therapist, Session, Service, DailyStats } from '@/types';

/**
 * Calculates session revenue with discount application
 * 
 * @param service - The service being provided
 * @param discount - Discount amount (default: 0)
 * @returns Object containing totalPrice, ladyPayout, and shopRevenue
 * 
 * Business Rules:
 * - Total price cannot be negative (discount cannot exceed service price)
 * - Lady payout and shop revenue remain fixed regardless of discount
 * - Discount only affects the total price paid by customer
 */
export const calculateSessionRevenue = (
  service: Service, 
  discount: number = 0
): { totalPrice: number; ladyPayout: number; shopRevenue: number } => {
  // Ensure total price never goes below zero
  const totalPrice = Math.max(0, service.price - discount);
  const ladyPayout = service.ladyPayout;
  const shopRevenue = service.shopRevenue;
  
  return {
    totalPrice,
    ladyPayout,
    shopRevenue,
  };
};

/**
 * Calculates individual therapist payout from total payout
 * 
 * @param totalPayout - Total payout amount to distribute
 * @param therapistCount - Number of therapists to split payout among
 * @returns Individual payout amount per therapist
 * 
 * Business Rules:
 * - Returns 0 if no therapists (prevents division by zero)
 * - Evenly distributes total payout among all therapists
 */
export const calculateIndividualPayout = (
  totalPayout: number, 
  therapistCount: number
): number => {
  return therapistCount > 0 ? totalPayout / therapistCount : 0;
};

export const calculateDailyTotals = (
  therapists: Therapist[], 
  sessions: Session[]
): DailyStats => {
  const totalSlips = sessions.length;
  const totalRevenue = sessions.reduce((sum, session) => sum + session.totalPrice, 0);
  const totalPayouts = therapists.reduce((sum, therapist) => sum + therapist.totalEarnings, 0);
  const totalDiscounts = sessions.reduce((sum, session) => sum + session.discount, 0);
  const shopRevenue = sessions.reduce((sum, session) => sum + session.service.shopRevenue, 0);
  const walkOutCount = 0; // This would come from walkOuts data
  const completedSessions = sessions.filter(session => session.status === 'completed').length;
  
  return {
    totalSlips,
    totalRevenue,
    totalPayouts,
    totalDiscounts,
    shopRevenue,
    walkOutCount,
    completedSessions,
  };
};

// Time calculations
export const calculateSessionEndTime = (
  startTime: Date, 
  durationMinutes: number
): Date => {
  return new Date(startTime.getTime() + durationMinutes * 60000);
};

export const formatTimeRemaining = (minutes: number): string => {
  if (minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Statistics calculations
export const calculateTherapistStats = (therapist: Therapist) => {
  const averageEarnings = therapist.totalSessions > 0 
    ? therapist.totalEarnings / therapist.totalSessions 
    : 0;
    
  return {
    averageEarnings,
    totalEarnings: therapist.totalEarnings,
    totalSessions: therapist.totalSessions,
  };
};

export const calculateRoomUtilization = (
  rooms: Array<{ id: string; name: string }>, 
  sessions: Session[]
): Record<string, number> => {
  const utilization: Record<string, number> = {};
  
  rooms.forEach(room => {
    const roomSessions = sessions.filter(session => session.roomId === room.id);
    const totalDuration = roomSessions.reduce((sum, session) => {
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      const duration = endTime.getTime() - startTime.getTime();
      return sum + duration;
    }, 0);
    
    // Assuming 8-hour work day (8 * 60 * 60 * 1000 ms)
    const workDayMs = 8 * 60 * 60 * 1000;
    utilization[room.id] = Math.min(100, (totalDuration / workDayMs) * 100);
  });
  
  return utilization;
};
