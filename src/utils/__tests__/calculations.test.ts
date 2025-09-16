import {
  calculateSessionRevenue,
  calculateIndividualPayout,
  calculateDailyTotals,
  calculateSessionEndTime,
  formatTimeRemaining,
  calculateTherapistStats,
  calculateRoomUtilization,
} from '@/utils/calculations';
import type { Therapist, Session, Service, Room } from '@/types';

describe('Financial Calculations', () => {
  describe('calculateSessionRevenue', () => {
    const mockService: Service = {
      id: '1',
      category: 'Single',
      roomType: 'Shower',
      duration: 60,
      price: 100,
      ladyPayout: 40,
      shopRevenue: 60,
      description: 'Test service',
    };

    it('should calculate revenue without discount', () => {
      const result = calculateSessionRevenue(mockService);
      
      expect(result).toEqual({
        totalPrice: 100,
        ladyPayout: 40,
        shopRevenue: 60,
      });
    });

    it('should calculate revenue with discount', () => {
      const result = calculateSessionRevenue(mockService, 20);
      
      expect(result).toEqual({
        totalPrice: 80,
        ladyPayout: 40,
        shopRevenue: 60,
      });
    });

    it('should handle discount larger than price', () => {
      const result = calculateSessionRevenue(mockService, 150);
      
      expect(result).toEqual({
        totalPrice: 0,
        ladyPayout: 40,
        shopRevenue: 60,
      });
    });

    it('should handle zero discount', () => {
      const result = calculateSessionRevenue(mockService, 0);
      
      expect(result).toEqual({
        totalPrice: 100,
        ladyPayout: 40,
        shopRevenue: 60,
      });
    });
  });

  describe('calculateIndividualPayout', () => {
    it('should calculate individual payout for multiple therapists', () => {
      const result = calculateIndividualPayout(120, 3);
      expect(result).toBe(40);
    });

    it('should handle single therapist', () => {
      const result = calculateIndividualPayout(100, 1);
      expect(result).toBe(100);
    });

    it('should return 0 for zero therapists', () => {
      const result = calculateIndividualPayout(100, 0);
      expect(result).toBe(0);
    });

    it('should handle decimal results', () => {
      const result = calculateIndividualPayout(100, 3);
      expect(result).toBeCloseTo(33.33, 2);
    });
  });

  describe('calculateDailyTotals', () => {
    const mockTherapists: Therapist[] = [
      {
        id: '1',
        name: 'Therapist 1',
        status: 'available',
        totalEarnings: 200,
        totalSessions: 5,
        expenses: []
      },
      {
        id: '2',
        name: 'Therapist 2',
        status: 'available',
        totalEarnings: 150,
        totalSessions: 3,
        expenses: []
      },
    ];

    const mockSessions: Session[] = [
      {
        id: '1',
        therapistIds: ['1'],
        service: {
          id: '1',
          category: 'Single',
          roomType: 'Shower',
          duration: 60,
          price: 100,
          ladyPayout: 40,
          shopRevenue: 60,
          description: 'Test service',
        },
        roomId: '1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00'),
        discount: 10,
        totalPrice: 90,
        status: 'completed',
      },
      {
        id: '2',
        therapistIds: ['2'],
        service: {
          id: '2',
          category: 'Double',
          roomType: 'VIP Jacuzzi',
          duration: 90,
          price: 200,
          ladyPayout: 80,
          shopRevenue: 120,
          description: 'Test service 2',
        },
        roomId: '2',
        startTime: new Date('2024-01-01T12:00:00'),
        endTime: new Date('2024-01-01T13:30:00'),
        discount: 0,
        totalPrice: 200,
        status: 'completed',
      },
    ];

    it('should calculate daily totals correctly', () => {
      const result = calculateDailyTotals(mockTherapists, mockSessions);
      
      expect(result).toEqual({
        totalSlips: 2,
        totalRevenue: 290, // 90 + 200
        totalPayouts: 350, // 200 + 150
        totalDiscounts: 10, // 10 + 0
        shopRevenue: 180, // 60 + 120
        walkOutCount: 0,
        completedSessions: 2, // Both sessions are completed
      });
    });

    it('should handle empty sessions', () => {
      const result = calculateDailyTotals(mockTherapists, []);
      
      expect(result).toEqual({
        totalSlips: 0,
        totalRevenue: 0,
        totalPayouts: 350,
        totalDiscounts: 0,
        shopRevenue: 0,
        walkOutCount: 0,
        completedSessions: 0,
      });
    });

    it('should handle empty therapists', () => {
      const result = calculateDailyTotals([], mockSessions);
      
      expect(result).toEqual({
        totalSlips: 2,
        totalRevenue: 290,
        totalPayouts: 0,
        totalDiscounts: 10,
        shopRevenue: 180,
        walkOutCount: 0,
        completedSessions: 2, // Both sessions are completed
      });
    });
  });
});

describe('Time Calculations', () => {
  describe('calculateSessionEndTime', () => {
    it('should calculate end time correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const endTime = calculateSessionEndTime(startTime, 60);
      
      expect(endTime).toEqual(new Date('2024-01-01T11:00:00'));
    });

    it('should handle zero duration', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const endTime = calculateSessionEndTime(startTime, 0);
      
      expect(endTime).toEqual(startTime);
    });

    it('should handle negative duration', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const endTime = calculateSessionEndTime(startTime, -30);
      
      expect(endTime).toEqual(new Date('2024-01-01T09:30:00'));
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format minutes only', () => {
      expect(formatTimeRemaining(30)).toBe('30m');
    });

    it('should format hours and minutes', () => {
      expect(formatTimeRemaining(90)).toBe('1h 30m');
    });

    it('should format hours only', () => {
      expect(formatTimeRemaining(120)).toBe('2h 0m');
    });

    it('should handle zero minutes', () => {
      expect(formatTimeRemaining(0)).toBe('0m');
    });

    it('should handle negative minutes', () => {
      expect(formatTimeRemaining(-10)).toBe('0m');
    });
  });
});

describe('Statistics Calculations', () => {
  describe('calculateTherapistStats', () => {
    it('should calculate stats for therapist with sessions', () => {
      const therapist: Therapist = {
        id: '1',
        name: 'Test Therapist',
        status: 'available',
        totalEarnings: 500,
        totalSessions: 10,
        expenses: []
      };

      const result = calculateTherapistStats(therapist);
      
      expect(result).toEqual({
        averageEarnings: 50,
        totalEarnings: 500,
        totalSessions: 10,
      });
    });

    it('should handle therapist with no sessions', () => {
      const therapist: Therapist = {
        id: '1',
        name: 'Test Therapist',
        status: 'available',
        totalEarnings: 0,
        totalSessions: 0,
        expenses: []
      };

      const result = calculateTherapistStats(therapist);
      
      expect(result).toEqual({
        averageEarnings: 0,
        totalEarnings: 0,
        totalSessions: 0,
      });
    });
  });

  describe('calculateRoomUtilization', () => {
    const mockRooms: Room[] = [
      { id: '1', name: 'Room 1', type: 'Shower', status: 'available' },
      { id: '2', name: 'Room 2', type: 'VIP Jacuzzi', status: 'available' },
    ];

    const mockSessions: Session[] = [
      {
        id: '1',
        therapistIds: ['1'],
        service: {
          id: '1',
          category: 'Single',
          roomType: 'Shower',
          duration: 60,
          price: 100,
          ladyPayout: 40,
          shopRevenue: 60,
          description: 'Test service',
        },
        roomId: '1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00'),
        discount: 0,
        totalPrice: 100,
        status: 'completed',
      },
      {
        id: '2',
        therapistIds: ['2'],
        service: {
          id: '2',
          category: 'Single',
          roomType: 'Shower',
          duration: 120,
          price: 200,
          ladyPayout: 80,
          shopRevenue: 120,
          description: 'Test service 2',
        },
        roomId: '1',
        startTime: new Date('2024-01-01T12:00:00'),
        endTime: new Date('2024-01-01T14:00:00'),
        discount: 0,
        totalPrice: 200,
        status: 'completed',
      },
    ];

    it('should calculate room utilization correctly', () => {
      const result = calculateRoomUtilization(mockRooms, mockSessions);
      
      // Room 1: 180 minutes (3 hours) out of 480 minutes (8 hours) = 37.5%
      // Room 2: 0 minutes out of 480 minutes = 0%
      expect(result['1']).toBeCloseTo(37.5, 1);
      expect(result['2']).toBe(0);
    });

    it('should cap utilization at 100%', () => {
      const longSession: Session = {
        id: '3',
        therapistIds: ['1'],
        service: {
          id: '3',
          category: 'Single',
          roomType: 'Shower',
          duration: 600, // 10 hours
          price: 100,
          ladyPayout: 40,
          shopRevenue: 60,
          description: 'Long session',
        },
        roomId: '1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T20:00:00'),
        discount: 0,
        totalPrice: 100,
        status: 'completed',
      };

      const result = calculateRoomUtilization(mockRooms, [longSession]);
      expect(result['1']).toBe(100);
    });

    it('should handle empty sessions', () => {
      const result = calculateRoomUtilization(mockRooms, []);
      
      expect(result['1']).toBe(0);
      expect(result['2']).toBe(0);
    });
  });
});
