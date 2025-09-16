export interface MonthlyStats {
  month: string; // Format: "2024-01"
  year: number;
  monthName: string; // "January", "February", etc.
  
  // Session metrics
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  
  // Revenue metrics
  totalRevenue: number;
  totalPayouts: number;
  shopRevenue: number;
  totalDiscounts: number;
  
  // Walkout metrics
  totalWalkOuts: number;
  walkOutReasons: Record<string, number>;
  
  // Service breakdown
  serviceBreakdown: {
    single: number;
    double: number;
    couple: number;
  };
  
  // Room utilization
  roomUtilization: {
    shower: number;
    vipJacuzzi: number;
    doubleBedShower: number;
    singleBedShower: number;
  };
  
  // Therapist performance
  therapistStats: {
    totalTherapists: number;
    averageSessionsPerTherapist: number;
    topPerformer: {
      name: string;
      sessions: number;
      earnings: number;
    };
  };
  
  // Daily breakdown for the month
  dailyBreakdown: DailyStats[];
}

export interface DailyStats {
  date: string; // Format: "2024-01-15"
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  
  totalSessions: number;
  totalRevenue: number;
  totalPayouts: number;
  shopRevenue: number;
  walkOuts: number;
  
  // Peak hours analysis
  peakHours: {
    hour: number;
    sessions: number;
  }[];
}

export interface StatsOverview {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  yearToDate: {
    totalSessions: number;
    totalRevenue: number;
    totalPayouts: number;
    shopRevenue: number;
    averageMonthlyRevenue: number;
    growthRate: number; // Percentage change from previous year
  };
  
  // Trends
  trends: {
    revenueGrowth: number; // Month over month
    sessionGrowth: number;
    walkOutRate: number; // Percentage of walkouts vs total sessions
    averageSessionValue: number;
  };
}

export interface StatsFilters {
  startDate?: Date;
  endDate?: Date;
  therapistId?: string;
  serviceCategory?: 'Single' | 'Double' | 'Couple';
  roomType?: string;
}
