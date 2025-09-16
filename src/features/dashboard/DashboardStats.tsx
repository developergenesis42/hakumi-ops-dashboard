import * as React from 'react';
import { Statistics, StatItem } from '@/shared/components/ui/Statistics';
import { formatCurrency } from '@/utils/helpers';

interface DashboardStatsProps {
  totalSlips: number;
  totalRevenue: number;
  totalPayouts: number;
  totalDiscounts: number;
  shopRevenue: number;
  totalExpenses: number;
  onOpenExpensesModal: () => void;
}

export function DashboardStats({
  totalSlips,
  totalRevenue,
  totalPayouts,
  totalDiscounts,
  shopRevenue,
  totalExpenses,
  onOpenExpensesModal
}: DashboardStatsProps) {
  // Memoized statistics data to prevent unnecessary re-renders
  const statisticsData = React.useMemo(() => [
    {
      id: 'totalSlips',
      icon: '📊',
      label: 'Total Rooms',
      value: totalSlips,
      variant: 'default' as const
    },
    {
      id: 'totalRevenue',
      icon: '💵',
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      variant: 'default' as const
    },
    {
      id: 'totalPayouts',
      icon: '👩',
      label: 'Ladies\' Payout',
      value: formatCurrency(totalPayouts),
      variant: 'default' as const
    },
    {
      id: 'totalDiscounts',
      icon: '🏷️',
      label: 'Discounts',
      value: `-${formatCurrency(totalDiscounts)}`,
      variant: 'default' as const
    },
    {
      id: 'shopRevenue',
      icon: '🏪',
      label: 'Shop Revenue',
      value: formatCurrency(shopRevenue),
      variant: 'default' as const
    }
  ], [totalSlips, totalRevenue, totalPayouts, totalDiscounts, shopRevenue]);

  return (
    <Statistics className="mb-6">
      {statisticsData.map((stat) => (
        <StatItem
          key={stat.id}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          variant={stat.variant}
        />
      ))}
      
      <StatItem
        icon="💰"
        label="Total Expenses"
        value={formatCurrency(totalExpenses)}
        variant="expense"
        onClick={onOpenExpensesModal}
      />
    </Statistics>
  );
}
