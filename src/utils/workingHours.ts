import type { Therapist } from '@/types';

export interface WorkingHours {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
}

/**
 * Calculate working hours for a therapist based on check-in and departure times
 */
export function calculateWorkingHours(therapist: Therapist): WorkingHours | null {
  if (!therapist.checkInTime) {
    return null; // No check-in time recorded
  }

  const checkInTime = new Date(therapist.checkInTime);
  const departureTime = therapist.departureTime ? new Date(therapist.departureTime) : new Date();
  
  const totalMinutes = Math.floor((departureTime.getTime() - checkInTime.getTime()) / (1000 * 60));
  
  if (totalMinutes < 0) {
    return null; // Invalid time range
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formatted = hours > 0 
    ? `${hours}h ${minutes}m`
    : `${minutes}m`;

  return {
    hours,
    minutes,
    totalMinutes,
    formatted
  };
}

/**
 * Calculate working hours for all therapists in the roster
 */
export function calculateAllWorkingHours(therapists: Therapist[]): Array<{
  therapist: Therapist;
  workingHours: WorkingHours | null;
}> {
  return therapists.map(therapist => ({
    therapist,
    workingHours: calculateWorkingHours(therapist)
  }));
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format working hours from minutes to human-readable format
 */
export function formatWorkingHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}
