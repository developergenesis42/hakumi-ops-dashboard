import { useMemo } from 'react';
import type { Therapist } from '@/types';
import { formatCurrency } from '@/utils/helpers';

interface ExpensesSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapists: Therapist[];
}

// Predefined expense items for categorization
const EXPENSE_ITEMS = [
  { id: 'mouthwash', label: 'Mouthwash', icon: '🦷' },
  { id: 'body-soap', label: 'Body Soap', icon: '🧼' },
  { id: 'tissue', label: 'Tissue', icon: '🧻' },
  { id: 'condom-xl', label: 'Condom XL', icon: '📦' },
  { id: 'condom-52', label: 'Condom 52', icon: '📦' },
  { id: 'condom-48', label: 'Condom 48', icon: '📦' }
];

export default function ExpensesSummaryModal({ isOpen, onClose, therapists }: ExpensesSummaryModalProps) {
  const expensesData = useMemo(() => {
    // Calculate total expenses
    const totalExpenses = therapists.reduce((sum, therapist) => {
      return sum + therapist.expenses.reduce((therapistSum, expense) => therapistSum + expense.amount, 0);
    }, 0);

    // Group expenses by type
    const expensesByType = therapists.reduce((acc, therapist) => {
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

    // Get expenses by therapist
    const therapistsWithExpenses = therapists.filter(therapist => therapist.expenses.length > 0);
    const expensesByTherapist = therapistsWithExpenses
      .map(therapist => ({
        therapist,
        totalAmount: therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0),
        expenseCount: therapist.expenses.length
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalExpenses,
      expensesByType,
      expensesByTherapist,
      therapistsWithExpensesCount: therapistsWithExpenses.length
    };
  }, [therapists]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>💰</span>
            Daily Expenses Summary
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Total Expenses Card */}
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-2 border-red-200">
          <div className="text-center">
            <div className="text-sm font-medium text-red-600 mb-1">Total Expenses Today</div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(expensesData.totalExpenses)}
            </div>
            <div className="text-sm text-red-600 mt-1">
              Across {expensesData.therapistsWithExpensesCount} therapist{expensesData.therapistsWithExpensesCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by Type */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              Expenses by Category
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expensesData.expensesByType.length > 0 ? (
                expensesData.expensesByType.map(({ type, amount, count }) => {
                  const item = EXPENSE_ITEMS.find(i => i.label === type);
                  const percentage = (amount / expensesData.totalExpenses) * 100;
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item?.icon || '📝'}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type}</div>
                          <div className="text-sm text-gray-500">{count} item{count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(amount)}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <div>No expenses recorded today</div>
                </div>
              )}
            </div>
          </div>

          {/* Expenses by Therapist */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>👥</span>
              Expenses by Therapist
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expensesData.expensesByTherapist.length > 0 ? (
                expensesData.expensesByTherapist.map(({ therapist, totalAmount, expenseCount }) => {
                  const percentage = (totalAmount / expensesData.totalExpenses) * 100;
                  
                  return (
                    <div key={therapist.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {therapist.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{therapist.name}</div>
                          <div className="text-sm text-gray-500">{expenseCount} expense{expenseCount !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <div>No expenses recorded today</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
