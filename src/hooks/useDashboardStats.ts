import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useSupabaseData } from '@/hooks/useSupabaseData';

export interface DashboardStats {
  totalSlips: number;
  totalRevenue: number;
  totalPayouts: number;
  totalDiscounts: number;
  shopRevenue: number;
  totalExpenses: number;
  walkOutCount: number;
}

export function useDashboardStats(): DashboardStats {
  const { state } = useApp();
  const { sessions: supabaseSessions } = useSupabaseData();

  return useMemo(() => {
    // Use sessions from Supabase (which includes all completed sessions from all devices)
    // Fallback to local state if Supabase sessions are not loaded yet
    const allSessions = supabaseSessions.length > 0 ? supabaseSessions : state.sessions;
    
    // Calculate total expenses across all therapists
    const totalExpenses = state.todayRoster.reduce((sum, therapist) => {
      return sum + therapist.expenses.reduce((therapistSum, expense) => therapistSum + expense.amount, 0);
    }, 0);
    
    // Calculate shop revenue: session shop revenue - discounts + lady expenses (ladies buy from shop)
    const grossShopRevenue = allSessions.reduce((sum, session) => sum + Math.max(0, session.service.shopRevenue - session.discount), 0);
    const netShopRevenue = grossShopRevenue + totalExpenses; // Add lady expenses to shop revenue (ladies buy from shop)
    
    return {
      totalSlips: allSessions.length, // Count all sessions
      totalRevenue: allSessions.reduce((sum, session) => sum + session.totalPrice, 0), // All sessions (discounted amount paid by customer)
      totalPayouts: allSessions.reduce((sum, session) => sum + session.service.ladyPayout, 0), // All sessions (fixed payout, not affected by discount)
      totalDiscounts: allSessions.reduce((sum, session) => sum + session.discount, 0), // All sessions (discount applied at start)
      shopRevenue: Math.max(0, netShopRevenue), // Shop revenue minus discounts plus lady expenses (never negative)
      totalExpenses, // Total expenses across all therapists
      walkOutCount: state.walkOuts.reduce((sum, walkOut) => sum + (walkOut.count || 1), 0)
    };
  }, [supabaseSessions, state.sessions, state.todayRoster, state.walkOuts]);
}
