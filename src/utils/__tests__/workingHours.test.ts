import { calculateWorkingHours, calculateAllWorkingHours, formatTime, formatDateTime } from '@/utils/workingHours';
import type { Therapist } from '@/types';

describe('workingHours utilities', () => {
  const mockTherapist: Therapist = {
    id: '1',
    name: 'Test Therapist',
    status: 'available',
    totalEarnings: 100,
    totalSessions: 1,
    checkInTime: new Date('2024-01-01T09:00:00'),
    departureTime: new Date('2024-01-01T17:00:00'),
    expenses: []
  };

  describe('calculateWorkingHours', () => {
    it('should calculate working hours correctly', () => {
      const result = calculateWorkingHours(mockTherapist);
      
      expect(result).not.toBeNull();
      expect(result?.hours).toBe(8);
      expect(result?.minutes).toBe(0);
      expect(result?.totalMinutes).toBe(480);
      expect(result?.formatted).toBe('8h 0m');
    });

    it('should calculate working hours with minutes', () => {
      const therapistWithMinutes = {
        ...mockTherapist,
        checkInTime: new Date('2024-01-01T09:00:00'),
        departureTime: new Date('2024-01-01T17:30:00')
      };

      const result = calculateWorkingHours(therapistWithMinutes);
      
      expect(result).not.toBeNull();
      expect(result?.hours).toBe(8);
      expect(result?.minutes).toBe(30);
      expect(result?.totalMinutes).toBe(510);
      expect(result?.formatted).toBe('8h 30m');
    });

    it('should handle therapist without check-in time', () => {
      const therapistWithoutCheckIn = {
        ...mockTherapist,
        checkInTime: undefined
      };

      const result = calculateWorkingHours(therapistWithoutCheckIn);
      expect(result).toBeNull();
    });

    it('should handle therapist without departure time (still working)', () => {
      const therapistStillWorking = {
        ...mockTherapist,
        departureTime: undefined
      };

      const result = calculateWorkingHours(therapistStillWorking);
      expect(result).not.toBeNull();
      // Should calculate from check-in to current time
      expect(result?.totalMinutes).toBeGreaterThan(0);
    });

    it('should handle invalid time range', () => {
      const therapistInvalidTime = {
        ...mockTherapist,
        checkInTime: new Date('2024-01-01T17:00:00'),
        departureTime: new Date('2024-01-01T09:00:00') // Departure before check-in
      };

      const result = calculateWorkingHours(therapistInvalidTime);
      expect(result).toBeNull();
    });
  });

  describe('calculateAllWorkingHours', () => {
    it('should calculate working hours for all therapists', () => {
      const therapists: Therapist[] = [
        mockTherapist,
        {
          ...mockTherapist,
          id: '2',
          name: 'Test Therapist 2',
          checkInTime: new Date('2024-01-01T10:00:00'),
          departureTime: new Date('2024-01-01T18:00:00')
        }
      ];

      const result = calculateAllWorkingHours(therapists);
      
      expect(result).toHaveLength(2);
      expect(result[0].workingHours?.formatted).toBe('8h 0m');
      expect(result[1].workingHours?.formatted).toBe('8h 0m');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-01T14:30:00');
      const result = formatTime(date);
      
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-01T14:30:00');
      const result = formatDateTime(date);
      
      expect(result).toMatch(/Jan \d{1,2}, \d{1,2}:\d{2} (AM|PM)/);
    });
  });
});
