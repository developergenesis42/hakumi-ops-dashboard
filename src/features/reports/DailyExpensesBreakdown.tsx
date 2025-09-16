import { formatCurrency } from '@/utils/helpers';
import type { Therapist } from '@/types';

interface DailyExpensesBreakdownProps {
  todayRoster: Therapist[];
  totalExpenses: number;
}

export default function DailyExpensesBreakdown({ todayRoster, totalExpenses }: DailyExpensesBreakdownProps) {
  if (totalExpenses === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span>💰</span>
        Daily Expenses Breakdown
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-3">Expenses by Category</h3>
          <div className="space-y-2">
            {(() => {
              // Group expenses by type
              const expensesByType = todayRoster.reduce((acc, therapist) => {
                therapist.expenses.forEach(expense => {
                  const existing = acc.find(item => item.type === expense.type);
                  if (existing) {
                    existing.amount += expense.amount;
                    existing.count += 1;
                  } else {
                    acc.push({
                      type: expense.type,
                      amount: expense.amount,
                      count: 1
                    });
                  }
                });
                return acc;
              }, [] as Array<{ type: string; amount: number; count: number }>);

              // Sort by amount descending
              expensesByType.sort((a, b) => b.amount - a.amount);

              return expensesByType.map(({ type, amount, count }) => {
                const percentage = (amount / totalExpenses) * 100;
                return (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-white">{type}</div>
                      <div className="text-xs text-gray-400">({count} item{count !== 1 ? 's' : ''})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-400">{formatCurrency(amount)}</div>
                      <div className="text-xs text-gray-400">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Expenses by Therapist */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-3">Expenses by Therapist</h3>
          <div className="space-y-2">
            {todayRoster
              .filter(therapist => therapist.expenses.length > 0)
              .map(therapist => {
                const totalAmount = therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                const percentage = (totalAmount / totalExpenses) * 100;
                
                return (
                  <div key={therapist.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold text-sm">
                          {therapist.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{therapist.name}</div>
                        <div className="text-xs text-gray-400">{therapist.expenses.length} expense{therapist.expenses.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-400">{formatCurrency(totalAmount)}</div>
                      <div className="text-xs text-gray-400">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
