import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { calculatePayout } from '@/utils/helpers';

export interface ClosingStats {
  totalSlips: number;
  totalRevenue: number;
  totalPayouts: number;
  totalDiscounts: number;
  totalExpenses: number;
  shopRevenue: number;
  walkOutCount: number;
  grossShopRevenue: number;
  netShopRevenue: number;
  totalAllPayouts: number;
  remainingPayouts: number;
}

export function useClosingStats(): ClosingStats {
  const { state } = useApp();

  return useMemo(() => {
    // Calculate total expenses across all therapists
    const totalExpenses = state.todayRoster.reduce((sum, therapist) => {
      return sum + therapist.expenses.reduce((therapistSum, expense) => therapistSum + expense.amount, 0);
    }, 0);

    // Calculate stats with correct logic for each metric
    const allSessions = state.sessions; // All sessions (active + completed)
    
    const calculatedStats = {
      totalSlips: allSessions.length, // Count all sessions
      totalRevenue: allSessions.reduce((sum, session) => sum + session.totalPrice, 0), // All sessions (discounted amount paid by customer)
      totalPayouts: allSessions.reduce((sum, session) => sum + session.service.ladyPayout, 0), // All sessions (fixed payout, not affected by discount)
      totalDiscounts: allSessions.reduce((sum, session) => sum + session.discount, 0), // All sessions (discount applied at start)
      totalExpenses, // Total expenses across all therapists
      shopRevenue: 0, // Will be calculated below
      walkOutCount: state.walkOuts.reduce((sum, walkOut) => sum + (walkOut.count || 1), 0)
    };

    // Calculate shop revenue: session shop revenue - discounts + lady expenses (ladies buy from shop)
    const grossShopRevenue = allSessions.reduce((sum, session) => sum + Math.max(0, session.service.shopRevenue - session.discount), 0);
    const netShopRevenue = grossShopRevenue + totalExpenses; // Add lady expenses to shop revenue (ladies buy from shop)
    calculatedStats.shopRevenue = Math.max(0, netShopRevenue); // Shop revenue minus discounts plus lady expenses (never negative)

    const remainingTherapists = state.todayRoster.filter(t => t.status === 'available');
    const remainingPayouts = remainingTherapists.reduce((sum, t) => {
      const totalExpenses = t.expenses.reduce((expenseSum, expense) => expenseSum + expense.amount, 0);
      return sum + calculatePayout(t.totalEarnings, totalExpenses);
    }, 0);
    
    const totalAllPayouts = state.todayRoster.reduce((sum, t) => {
      const totalExpenses = t.expenses.reduce((expenseSum, expense) => expenseSum + expense.amount, 0);
      return sum + calculatePayout(t.totalEarnings, totalExpenses);
    }, 0);

    return {
      ...calculatedStats,
      grossShopRevenue,
      netShopRevenue,
      totalAllPayouts,
      remainingPayouts
    };
  }, [state.sessions, state.todayRoster, state.walkOuts]);
}
