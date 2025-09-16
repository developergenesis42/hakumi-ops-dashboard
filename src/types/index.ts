// Comprehensive type definitions matching actual codebase usage

export interface Therapist {
  id: string;
  name: string;
  status: 'inactive' | 'available' | 'in-session' | 'departed';
  expenses?: Array<{ 
    id?: string;
    amount: number; 
    description: string;
    type?: string;
    therapistId?: string;
    timestamp?: Date;
  }>;
  totalEarnings?: number;
  totalSessions?: number;
  checkInTime?: string | Date;
  departureTime?: string | Date;
  currentSession?: string | Session; // session ID or Session object
  // Today's stats (calculated from sessions)
  todaySessions?: number;
  todayEarnings?: number;
}

export interface Service {
  id: string;
  name: string;
  category: 'Single' | 'Double' | 'Couple';
  roomType: 'Shower' | 'VIP Jacuzzi' | 'Double Bed Shower (large)' | 'Single Bed Shower (large)';
  duration: number;
  price: number;
  ladyPayout: number;
  shopRevenue: number;
  description: string;
}

export interface Room {
  id: string;
  name: string;
  status?: string;
  type?: string;
  currentSession?: string; // session ID
}

export interface Session {
  id: string;
  therapistIds: string[];
  service: Service;
  roomId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  startTime?: string | Date;
  endTime?: string | Date;
  sessionStartTime?: string | Date;
  prepStartTime?: string | Date;
  actualEndTime?: string | Date;
  actualDuration?: number;
  isInPrepPhase?: boolean;
  totalPrice?: number;
  discount?: number;
}

export type WalkOutReason = 'No Rooms' | 'No Ladies' | 'Price Too High' | 'Client Too Picky' | 'Chinese' | 'Laowai';

export interface WalkOut {
  id: string;
  sessionId: string;
  therapistIds: string[];
  service: Service;
  totalAmount: number;
  timestamp: Date;
  count?: number;
  reason: WalkOutReason;
}

export interface DailyStats {
  date?: string;
  totalRevenue: number;
  totalPayouts: number;
  totalDiscounts: number;
  shopRevenue: number;
  completedSessions: number;
  totalSlips: number;
  walkOutCount: number;
}

export type ExpenseType = 'Condom 12' | 'Condom 24' | 'Condom 36' | 'Condom 48' | 'Lube' | 'Towel' | 'Other';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  type: ExpenseType;
  therapistId?: string;
}

export interface ExpenseTypeInfo {
  id: string;
  name: string;
  label: string;
}

// Undo/History types
export interface UndoStackItem {
  action: AppAction;
  timestamp: Date;
  description: string;
}

export interface HistoryEntry {
  action: AppAction;
  timestamp: Date;
  description: string;
  stateSnapshot: Partial<AppState>;
}

// App State with all required properties
export interface AppState {
  // Application phase
  currentPhase: 'roster-setup' | 'daily-operations' | 'closing-out' | 'admin-dashboard' | 'todos';
  
  // Core data
  therapists: Therapist[];
  todayRoster: Therapist[];
  sessions: Session[];
  rooms: Room[];
  services: Service[];
  walkOuts: WalkOut[];
  
  // Calculated data
  dailyStats: DailyStats;
  
  // State management
  history: HistoryEntry[];
  undoStack: UndoStackItem[];
  
  // UI state
  loading?: boolean;
  error?: string | null;
}

// Action types
export interface AppAction {
  type: string;
  payload?: unknown;
}