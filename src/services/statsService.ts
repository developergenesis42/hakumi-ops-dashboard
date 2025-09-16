import { supabase } from '@/lib/supabase';
import type { MonthlyStats, DailyStats, StatsOverview } from '@/types/stats';

export class StatsService {
  /**
   * Get monthly stats for a specific month from real database
   */
  static async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    try {
      // Get sessions for the month
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          services (
            id,
            category,
            room_type,
            duration,
            price,
            lady_payout,
            shop_revenue,
            description
          )
        `)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      // Get walkouts for the month
      const { data: walkouts } = await supabase
        .from('walk_outs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get therapists for the month
      const { data: therapists } = await supabase
        .from('therapists')
        .select('id, name');

      const monthSessions = sessions || [];
      const monthWalkouts = walkouts || [];
      const monthTherapists = therapists || [];

      // Calculate basic metrics
      const totalSessions = monthSessions.length;
      const completedSessions = monthSessions.filter(s => s.status === 'completed').length;
      const activeSessions = monthSessions.filter(s => s.status === 'in_progress').length;
      
      const totalRevenue = monthSessions.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const totalPayouts = monthSessions.reduce((sum, s) => {
        const service = s.services;
        return sum + (service?.lady_payout || 0) * (s.therapist_ids?.length || 1);
      }, 0);
      const shopRevenue = monthSessions.reduce((sum, s) => {
        const service = s.services;
        return sum + (service?.shop_revenue || 0);
      }, 0);
      const totalDiscounts = monthSessions.reduce((sum, s) => sum + (s.discount || 0), 0);
      
      const totalWalkOuts = monthWalkouts.reduce((sum, w) => sum + (w.count || 1), 0);
      
      // Walkout reasons breakdown
      const walkOutReasons: Record<string, number> = {};
      monthWalkouts.forEach(walkout => {
        const reason = walkout.reason || 'Unknown';
        walkOutReasons[reason] = (walkOutReasons[reason] || 0) + (walkout.count || 1);
      });

      // Service breakdown
      const serviceBreakdown = { single: 0, double: 0, couple: 0 };
      monthSessions.forEach(session => {
        const category = session.services?.category?.toLowerCase();
        if (category === 'single') serviceBreakdown.single++;
        else if (category === 'double') serviceBreakdown.double++;
        else if (category === 'couple') serviceBreakdown.couple++;
      });

      // Room utilization
      const roomUtilization = { shower: 0, vipJacuzzi: 0, doubleBedShower: 0, singleBedShower: 0 };
      monthSessions.forEach(session => {
        const roomType = session.services?.room_type?.toLowerCase();
        if (roomType?.includes('shower')) roomUtilization.shower++;
        else if (roomType?.includes('vip') || roomType?.includes('jacuzzi')) roomUtilization.vipJacuzzi++;
        else if (roomType?.includes('double')) roomUtilization.doubleBedShower++;
        else if (roomType?.includes('single')) roomUtilization.singleBedShower++;
      });

      // Therapist performance
      const therapistStats = {
        totalTherapists: monthTherapists.length,
        averageSessionsPerTherapist: monthTherapists.length > 0 ? totalSessions / monthTherapists.length : 0,
        topPerformer: { name: 'N/A', sessions: 0, earnings: 0 }
      };

      // Find top performer
      if (monthTherapists.length > 0) {
        const therapistSessionCounts: Record<string, { sessions: number; earnings: number }> = {};
        
        monthSessions.forEach(session => {
          session.therapist_ids?.forEach((therapistId: string) => {
            if (!therapistSessionCounts[therapistId]) {
              therapistSessionCounts[therapistId] = { sessions: 0, earnings: 0 };
            }
            therapistSessionCounts[therapistId].sessions++;
            const service = session.services;
            therapistSessionCounts[therapistId].earnings += service?.lady_payout || 0;
          });
        });

        const topTherapist = Object.entries(therapistSessionCounts)
          .sort(([,a], [,b]) => b.sessions - a.sessions)[0];
        
        if (topTherapist) {
          const therapist = monthTherapists.find(t => t.id === topTherapist[0]);
          therapistStats.topPerformer = {
            name: therapist?.name || 'Unknown',
            sessions: topTherapist[1].sessions,
            earnings: topTherapist[1].earnings
          };
        }
      }

      // Get daily breakdown
      const dailyBreakdown = await this.getDailyBreakdown(year, month);

      return {
        month: `${year}-${month.toString().padStart(2, '0')}`,
        year,
        monthName: startDate.toLocaleDateString('default', { month: 'long' }),
        totalSessions,
        completedSessions,
        activeSessions,
        totalRevenue,
        totalPayouts,
        shopRevenue,
        totalDiscounts,
        totalWalkOuts,
        walkOutReasons,
        serviceBreakdown,
        roomUtilization,
        therapistStats,
        dailyBreakdown
      };
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      throw new Error('Failed to load monthly statistics');
    }
  }

  /**
   * Get daily breakdown for a month
   */
  static async getDailyBreakdown(year: number, month: number): Promise<DailyStats[]> {
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const daysInMonth = endDate.getDate();

    const dailyStats: DailyStats[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const nextDate = new Date(year, month - 1, day + 1);

      try {
        // Get sessions for this day
        const { data: sessions } = await supabase
          .from('sessions')
          .select(`
            *,
            services (
              id,
              category,
              room_type,
              duration,
              price,
              lady_payout,
              shop_revenue,
              description
            )
          `)
          .gte('start_time', currentDate.toISOString())
          .lt('start_time', nextDate.toISOString());

        // Get walkouts for this day
        const { data: walkouts } = await supabase
          .from('walk_outs')
          .select('*')
          .gte('timestamp', currentDate.toISOString())
          .lt('timestamp', nextDate.toISOString());

        const daySessions = sessions || [];
        const dayWalkouts = walkouts || [];

        const totalSessions = daySessions.length;
        const totalRevenue = daySessions.reduce((sum, s) => sum + (s.total_price || 0), 0);
        const totalPayouts = daySessions.reduce((sum, s) => {
          const service = s.services;
          return sum + (service?.lady_payout || 0) * (s.therapist_ids?.length || 1);
        }, 0);
        const shopRevenue = daySessions.reduce((sum, s) => {
          const service = s.services;
          return sum + (service?.shop_revenue || 0);
        }, 0);
        const walkOuts = dayWalkouts.reduce((sum, w) => sum + (w.count || 1), 0);

        // Peak hours analysis
        const hourlySessions: Record<number, number> = {};
        daySessions.forEach(session => {
          const hour = new Date(session.start_time).getHours();
          hourlySessions[hour] = (hourlySessions[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourlySessions)
          .map(([hour, sessions]) => ({ hour: parseInt(hour), sessions }))
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 5);

        dailyStats.push({
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          totalSessions,
          totalRevenue,
          totalPayouts,
          shopRevenue,
          walkOuts,
          peakHours,
        });
      } catch (error) {
        console.error(`Error fetching stats for day ${day}:`, error);
        // Add empty stats for this day
        dailyStats.push({
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          totalSessions: 0,
          totalRevenue: 0,
          totalPayouts: 0,
          shopRevenue: 0,
          walkOuts: 0,
          peakHours: [],
        });
      }
    }

    return dailyStats;
  }

  /**
   * Get comprehensive stats overview from real database
   */
  static async getStatsOverview(): Promise<StatsOverview> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    try {
      // Get current month stats
      const currentMonthStats = await this.getMonthlyStats(currentYear, currentMonth);
      
      // Get previous month stats
      const previousMonthStats = await this.getMonthlyStats(previousYear, previousMonth);
      
      // Calculate year-to-date stats
      const yearToDateStats = await this.getYearToDateStats(currentYear);
      
      // Calculate trends
      const trends = {
        revenueGrowth: previousMonthStats.totalRevenue > 0 
          ? ((currentMonthStats.totalRevenue - previousMonthStats.totalRevenue) / previousMonthStats.totalRevenue) * 100
          : 0,
        sessionGrowth: previousMonthStats.totalSessions > 0
          ? ((currentMonthStats.totalSessions - previousMonthStats.totalSessions) / previousMonthStats.totalSessions) * 100
          : 0,
        walkOutRate: currentMonthStats.totalSessions > 0
          ? (currentMonthStats.totalWalkOuts / currentMonthStats.totalSessions) * 100
          : 0,
        averageSessionValue: currentMonthStats.totalSessions > 0
          ? currentMonthStats.totalRevenue / currentMonthStats.totalSessions
          : 0
      };

      return {
        currentMonth: currentMonthStats,
        previousMonth: previousMonthStats,
        yearToDate: yearToDateStats,
        trends
      };
    } catch (error) {
      console.error('Error fetching stats overview:', error);
      throw new Error('Failed to load stats overview');
    }
  }

  /**
   * Get year-to-date statistics from real database
   */
  static async getYearToDateStats(year: number): Promise<StatsOverview['yearToDate']> {
    try {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      
      // Get all sessions for the year
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          *,
          services (
            id,
            category,
            room_type,
            duration,
            price,
            lady_payout,
            shop_revenue,
            description
          )
        `)
        .gte('start_time', startOfYear.toISOString())
        .lte('start_time', endOfYear.toISOString());

      const yearSessions = sessions || [];
      
      const totalSessions = yearSessions.length;
      const totalRevenue = yearSessions.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const totalPayouts = yearSessions.reduce((sum, s) => {
        const service = s.services;
        return sum + (service?.lady_payout || 0) * (s.therapist_ids?.length || 1);
      }, 0);
      const shopRevenue = yearSessions.reduce((sum, s) => {
        const service = s.services;
        return sum + (service?.shop_revenue || 0);
      }, 0);
      
      const monthsInYear = 12;
      const averageMonthlyRevenue = totalRevenue / monthsInYear;
      
      // Calculate growth rate (would need previous year data for accurate calculation)
      const growthRate = 0; // Placeholder - would need previous year comparison

      return {
        totalSessions,
        totalRevenue,
        totalPayouts,
        shopRevenue,
        averageMonthlyRevenue,
        growthRate
      };
    } catch (error) {
      console.error('Error fetching year-to-date stats:', error);
      throw new Error('Failed to load year-to-date statistics');
    }
  }

  /**
   * Get filtered stats based on criteria
   */
  static async getFilteredStats(): Promise<MonthlyStats> {
    // Implementation for filtered stats would go here
    // This would allow filtering by therapist, service category, room type, etc.
    throw new Error('Filtered stats not yet implemented');
  }
}
