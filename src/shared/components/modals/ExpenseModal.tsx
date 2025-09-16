import React, { useState, useCallback } from 'react';
import type { Therapist, Expense, ExpenseType } from '@/types';
import { generateId } from '@/utils/helpers';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
  onAddExpense: (therapistId: string, expense: Expense) => void;
}

// Predefined expense items with fixed prices
const EXPENSE_ITEMS = [
  { id: 'condom-12', label: 'Condom 12', price: 50, icon: '📦' },
  { id: 'condom-24', label: 'Condom 24', price: 60, icon: '📦' },
  { id: 'condom-36', label: 'Condom 36', price: 70, icon: '📦' },
  { id: 'condom-48', label: 'Condom 48', price: 80, icon: '📦' },
  { id: 'lube', label: 'Lube', price: 100, icon: '🧴' },
  { id: 'towel', label: 'Towel', price: 30, icon: '🧻' },
  { id: 'other', label: 'Other', price: 0, icon: '📝' }
];

function ExpenseModal({ isOpen, onClose, therapist, onAddExpense }: ExpenseModalProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItem(itemId);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      alert('Please select an expense item');
      return;
    }

    const item = EXPENSE_ITEMS.find(i => i.id === selectedItem);
    if (!item) return;

    const amount = item.price;

    const expense: Expense = {
      id: generateId(),
      therapistId: therapist.id,
      type: item.label as ExpenseType,
      amount: amount,
      description: item.id === 'other' ? 'Custom expense' : undefined,
      timestamp: new Date()
    };

    onAddExpense(therapist.id, expense);
    
    // Reset form
    setSelectedItem(null);
    onClose();
  }, [selectedItem, therapist.id, onAddExpense, onClose]);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
    onClose();
  }, [onClose]);

  const totalExpenses = therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Expense - {therapist.name}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Total Expenses */}
        <div className="mb-4 p-3 bg-gray-200 rounded-lg border border-gray-300">
          <div className="text-sm text-gray-700">Total Expenses Today:</div>
          <div 
            className="text-lg font-bold" 
            style={{ 
              color: '#000000', 
              fontWeight: '700',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            ฿{totalExpenses.toLocaleString()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expense Items Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Expense Item
            </label>
            <div className="grid grid-cols-2 gap-3">
              {EXPENSE_ITEMS.map(({ id, label, price, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleItemSelect(id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedItem === id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {price > 0 && (
                      <span className="text-sm font-bold" style={{ color: '#000000' }}>
                        ฿{price}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Expense
            </button>
          </div>
        </form>

        {/* Recent Expenses */}
        {therapist.expenses.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Expenses</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {therapist.expenses.slice(-5).reverse().map((expense) => {
                const item = EXPENSE_ITEMS.find(i => i.label === expense.type);
                return (
                  <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {item?.icon || '📝'}
                      </span>
                      <span className="text-sm text-gray-700">{expense.type}</span>
                      {expense.description && (
                        <span className="text-xs text-gray-500">- {expense.description}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#000000' }}>
                      ฿{expense.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseModal;
