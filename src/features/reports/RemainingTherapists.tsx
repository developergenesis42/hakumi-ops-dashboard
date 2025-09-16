import { formatCurrency, calculatePayout } from '@/utils/helpers';
import type { Therapist } from '@/types';

interface RemainingTherapistsProps {
  remainingTherapists: Therapist[];
  totalPayouts: number;
  totalAllPayouts: number;
}

export default function RemainingTherapists({ 
  remainingTherapists, 
  totalPayouts, 
  totalAllPayouts 
}: RemainingTherapistsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Remaining Therapists</h2>
      
      {remainingTherapists.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-green-400 font-medium">All therapists have left work</p>
          <p className="text-sm text-gray-400">Ready to reset for next day</p>
        </div>
      ) : (
        <div className="space-y-3">
          {remainingTherapists.map((therapist) => (
            <div key={therapist.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-white">{therapist.name}</div>
                <div className="text-sm text-gray-400">ID: {therapist.id}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Earnings</div>
                <div className="font-semibold text-green-400">{formatCurrency(therapist.totalEarnings)}</div>
                {therapist.expenses.length > 0 && (
                  <div className="text-xs text-red-400">Expenses: -{formatCurrency(therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0))}</div>
                )}
                <div className="text-xs text-purple-400">Payout: {formatCurrency(calculatePayout(therapist.totalEarnings, therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0)))}</div>
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-600 pt-3 mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-white">Total Payouts Due:</span>
              <span className="text-xl font-bold text-purple-400">{formatCurrency(totalPayouts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">All Time Payouts:</span>
              <span className="text-sm font-medium text-gray-400">{formatCurrency(totalAllPayouts)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
