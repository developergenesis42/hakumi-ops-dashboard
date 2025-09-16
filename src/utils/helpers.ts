import type { Session, Room, Therapist } from '@/types';

// Utility helper functions
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculatePayout = (session: Session, therapistCount: number): number => {
  if (!session?.service?.ladyPayout) return 0;
  return session.service.ladyPayout / therapistCount;
};

export const isSessionCompleted = (session: Session): boolean => {
  if (!session?.startTime) return false;
  const startTime = new Date(session.startTime);
  const now = new Date();
  const duration = session.service?.duration || 60; // Default 60 minutes
  const endTime = new Date(startTime.getTime() + duration * 60000);
  return now > endTime;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const getRemainingTime = (session: Session): number => {
  if (!session?.startTime) return 0;
  const startTime = new Date(session.startTime);
  const now = new Date();
  const duration = session.service?.duration || 60;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  const remaining = Math.max(0, endTime.getTime() - now.getTime());
  return Math.floor(remaining / 60000); // Return minutes
};

export const getAvailableRoomsByType = (rooms: Room[], type: string): Room[] => {
  return rooms.filter(room => room.type === type && room.status === 'available');
};

export const getAvailableTherapists = (therapists: Therapist[]): Therapist[] => {
  return therapists.filter(therapist => therapist.status === 'available');
};

export const roundToNearest5Minutes = (minutes: number): number => {
  return Math.round(minutes / 5) * 5;
};

export const searchTherapists = (therapists: Therapist[], query: string): Therapist[] => {
  if (!query.trim()) return therapists;
  const lowercaseQuery = query.toLowerCase();
  return therapists.filter(therapist => 
    therapist.name.toLowerCase().includes(lowercaseQuery)
  );
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'in-session':
      return 'bg-blue-100 text-blue-800';
    case 'departed':
      return 'bg-gray-100 text-gray-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRoomStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'occupied':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};