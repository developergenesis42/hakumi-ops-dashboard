import {
  formatCurrency,
  formatDuration,
  getRemainingTime,
  isSessionCompleted,
  getAvailableRoomsByType,
  getAvailableTherapists,
  calculatePayout,
  roundToNearest5Minutes,
  generateId,
  searchTherapists,
  getStatusColor,
  getRoomStatusColor,
} from '@/utils/helpers';
import type { Session, Therapist, Room, Service } from '@/types';

// Mock service for tests
const mockService: Service = {
  id: '1',
  category: 'Single',
  roomType: 'Shower',
  duration: 60,
  price: 100,
  ladyPayout: 50,
  shopRevenue: 50,
  description: 'Test service',
};

describe('Helper Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('฿1,000');
      expect(formatCurrency(1234.56)).toBe('฿1,234.56');
      expect(formatCurrency(0)).toBe('฿0');
      expect(formatCurrency(999999)).toBe('฿999,999');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(0)).toBe('0m');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2h 0m');
      expect(formatDuration(150)).toBe('2h 30m');
    });
  });

  describe('getRemainingTime', () => {
    it('should calculate remaining time correctly', () => {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
      
      const session: Session = {
        id: '1',
        therapistIds: ['1'],
        service: mockService,
        roomId: '1',
        startTime: now,
        endTime,
        discount: 0,
        totalPrice: 100,
        status: 'scheduled',
      };

      const remaining = getRemainingTime(session);
      expect(remaining).toBeCloseTo(30, 1);
    });

    it('should return 0 for expired sessions', () => {
      const now = new Date();
      const endTime = new Date(now.getTime() - 30 * 60000); // 30 minutes ago
      
      const session: Session = {
        id: '1',
        therapistIds: ['1'],
        service: mockService,
        roomId: '1',
        startTime: now,
        endTime,
        discount: 0,
        totalPrice: 100,
        status: 'scheduled',
      };

      const remaining = getRemainingTime(session);
      expect(remaining).toBe(0);
    });
  });

  describe('isSessionCompleted', () => {
    it('should return true for completed sessions', () => {
      const now = new Date();
      const endTime = new Date(now.getTime() - 30 * 60000); // 30 minutes ago
      
      const session: Session = {
        id: '1',
        therapistIds: ['1'],
        service: mockService,
        roomId: '1',
        startTime: now,
        endTime,
        discount: 0,
        totalPrice: 100,
        status: 'scheduled',
      };

      expect(isSessionCompleted(session)).toBe(true);
    });

    it('should return false for active sessions', () => {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
      
      const session: Session = {
        id: '1',
        therapistIds: ['1'],
        service: mockService,
        roomId: '1',
        startTime: now,
        endTime,
        discount: 0,
        totalPrice: 100,
        status: 'scheduled',
      };

      expect(isSessionCompleted(session)).toBe(false);
    });
  });

  describe('getAvailableRoomsByType', () => {
    const mockRooms: Room[] = [
      { id: '1', name: 'Room 1', type: 'Shower', status: 'available' },
      { id: '2', name: 'Room 2', type: 'Shower', status: 'occupied' },
      { id: '3', name: 'Room 3', type: 'VIP Jacuzzi', status: 'available' },
      { id: '4', name: 'Room 4', type: 'VIP Jacuzzi', status: 'occupied' },
    ];

    it('should return available rooms of specified type', () => {
      const result = getAvailableRoomsByType(mockRooms, 'Shower');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty array when no rooms of type are available', () => {
      const result = getAvailableRoomsByType(mockRooms, 'Double Bed Shower (large)');
      expect(result).toHaveLength(0);
    });

    it('should include VIP Jacuzzi fallback for Single shower packages when no shower rooms available', () => {
      const roomsWithoutShower = mockRooms.filter(room => room.type !== 'Shower');
      const result = getAvailableRoomsByType(roomsWithoutShower, 'Shower');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('VIP Jacuzzi');
    });

    it('should not include fallback for non-Single packages', () => {
      const result = getAvailableRoomsByType(mockRooms, 'Shower');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Shower');
    });
  });

  describe('getAvailableTherapists', () => {
    const mockTherapists: Therapist[] = [
      { id: '1', name: 'Therapist 1', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '2', name: 'Therapist 2', status: 'in-session', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '3', name: 'Therapist 3', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '4', name: 'Therapist 4', status: 'departed', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ];

    it('should return only available therapists', () => {
      const result = getAvailableTherapists(mockTherapists);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.status === 'available')).toBe(true);
    });
  });

  describe('calculatePayout', () => {
    it('should return earnings minus expenses', () => {
      expect(calculatePayout(100, 0)).toBe(100);
      expect(calculatePayout(100, 20)).toBe(80);
      expect(calculatePayout(100, 50)).toBe(50);
      expect(calculatePayout(100, 100)).toBe(0);
      expect(calculatePayout(100, 150)).toBe(0); // Should not go negative
    });

    it('should handle zero expenses (backward compatibility)', () => {
      expect(calculatePayout({ service: { ladyPayout: 100 } }, 1)).toBe(100);
      expect(calculatePayout({ service: { ladyPayout: 0 } }, 1)).toBe(0);
      expect(calculatePayout({ service: { ladyPayout: 1234.56 } }, 1)).toBe(1234.56);
    });
  });

  describe('roundToNearest5Minutes', () => {
    it('should round up to nearest 5 minutes', () => {
      const minutes = 3;
      const rounded = roundToNearest5Minutes(minutes);
      expect(rounded).toBe(5);
    });

    it('should round up from exact 5-minute mark', () => {
      const minutes = 5;
      const rounded = roundToNearest5Minutes(minutes);
      expect(rounded).toBe(5);
    });

    it('should handle hour rollover', () => {
      const minutes = 58;
      const rounded = roundToNearest5Minutes(minutes);
      expect(rounded).toBe(60);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('searchTherapists', () => {
    const mockTherapists: Therapist[] = [
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '2', name: 'Bob Smith', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '3', name: 'Charlie Brown', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ];

    it('should return all therapists for empty search term', () => {
      const result = searchTherapists(mockTherapists, '');
      expect(result).toEqual(mockTherapists);
    });

    it('should return all therapists for whitespace-only search term', () => {
      const result = searchTherapists(mockTherapists, '   ');
      expect(result).toEqual(mockTherapists);
    });

    it('should search by name (case insensitive)', () => {
      const result = searchTherapists(mockTherapists, 'alice');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should search by ID (case insensitive)', () => {
      const result = searchTherapists(mockTherapists, '2');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Smith');
    });

    it('should return empty array for no matches', () => {
      const result = searchTherapists(mockTherapists, 'xyz');
      expect(result).toHaveLength(0);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(getStatusColor('available')).toBe('bg-green-100 text-green-800 border-green-200');
      expect(getStatusColor('in-session')).toBe('bg-blue-100 text-blue-800 border-blue-200');
      expect(getStatusColor('absent')).toBe('bg-gray-100 text-gray-800 border-gray-200');
      expect(getStatusColor('departed')).toBe('bg-purple-100 text-purple-800 border-purple-200');
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800 border-gray-200');
    });
  });

  describe('getRoomStatusColor', () => {
    it('should return green for available rooms', () => {
      expect(getRoomStatusColor('available')).toBe('bg-green-500');
    });

    it('should return red for occupied rooms', () => {
      expect(getRoomStatusColor('occupied')).toBe('bg-red-500');
    });
  });
});
