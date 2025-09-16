import { supabase } from '@/lib/supabase';
import { Expense, ExpenseType } from '@/types';
import { debugLog } from '@/config/environment';

type ExpenseInsert = {
  id?: string;
  therapist_id: string;
  expense_type: ExpenseType;
  amount: number;
  description?: string | null;
  date?: string;
  created_at?: string;
  updated_at?: string;
};

type ExpenseUpdate = {
  id?: string;
  therapist_id?: string;
  expense_type?: ExpenseType;
  amount?: number;
  description?: string | null;
  date?: string;
  created_at?: string;
  updated_at?: string;
};

// Convert expense from database format to app format
const convertExpenseFromDB = (row: Record<string, unknown>): Expense => ({
  id: row.id as string,
  therapistId: row.therapist_id as string,
  type: row.expense_type as ExpenseType,
  amount: row.amount as number,
  description: (row.description as string) || '',
  timestamp: new Date(row.created_at as string)
});

// Convert expense from app format to database format
const convertExpenseToDB = (expense: Omit<Expense, 'id'>): ExpenseInsert => ({
  therapist_id: expense.therapistId,
  expense_type: expense.type,
  amount: expense.amount,
  description: expense.description || null,
  date: new Date().toISOString().split('T')[0] // Today's date
});

export class ExpenseService {
  /**
   * Get all expenses for a specific therapist on a specific date
   */
  static async getExpensesByTherapistAndDate(
    therapistId: string, 
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('therapist_id', therapistId)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        debugLog('Error fetching expenses:', error);
        throw error;
      }

      return data ? data.map(convertExpenseFromDB) : [];
    } catch (error) {
      debugLog('Failed to get expenses:', error);
      throw error;
    }
  }

  /**
   * Get all expenses for today
   */
  static async getTodayExpenses(): Promise<Expense[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (error) {
        debugLog('Error fetching today expenses:', error);
        throw error;
      }

      return data ? data.map(convertExpenseFromDB) : [];
    } catch (error) {
      debugLog('Failed to get today expenses:', error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  static async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      const expenseData = convertExpenseToDB(expense);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select('*')
        .single();

      if (error) {
        debugLog('Error creating expense:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No expense data returned from database');
      }

      const createdExpense = convertExpenseFromDB(data);
      debugLog('Expense created successfully:', createdExpense);
      return createdExpense;
    } catch (error) {
      debugLog('Failed to create expense:', error);
      throw error;
    }
  }

  /**
   * Update an existing expense
   */
  static async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const updateData: ExpenseUpdate = {};
      
      if (updates.type) updateData.expense_type = updates.type;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      
      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId)
        .select('*')
        .single();

      if (error) {
        debugLog('Error updating expense:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No expense data returned from database');
      }

      const updatedExpense = convertExpenseFromDB(data);
      debugLog('Expense updated successfully:', updatedExpense);
      return updatedExpense;
    } catch (error) {
      debugLog('Failed to update expense:', error);
      throw error;
    }
  }

  /**
   * Delete an expense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        debugLog('Error deleting expense:', error);
        throw error;
      }

      debugLog('Expense deleted successfully:', expenseId);
    } catch (error) {
      debugLog('Failed to delete expense:', error);
      throw error;
    }
  }

  /**
   * Get expenses for a date range
   */
  static async getExpensesByDateRange(
    startDate: string, 
    endDate: string
  ): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        debugLog('Error fetching expenses by date range:', error);
        throw error;
      }

      return data ? data.map(convertExpenseFromDB) : [];
    } catch (error) {
      debugLog('Failed to get expenses by date range:', error);
      throw error;
    }
  }

  /**
   * Get total expenses for a therapist on a specific date
   */
  static async getTotalExpensesByTherapistAndDate(
    therapistId: string, 
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('therapist_id', therapistId)
        .eq('date', date);

      if (error) {
        debugLog('Error fetching total expenses:', error);
        throw error;
      }

      const total = data ? data.reduce((sum, expense) => sum + expense.amount, 0) : 0;
      debugLog(`Total expenses for therapist ${therapistId} on ${date}:`, total);
      return total;
    } catch (error) {
      debugLog('Failed to get total expenses:', error);
      throw error;
    }
  }

  /**
   * Subscribe to expense changes for real-time updates
   */
  static subscribeToExpenses(
    callback: (expenses: Expense[]) => void,
    therapistId?: string
  ) {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: true });

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    return supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        async () => {
          try {
            const { data, error } = await query;
            if (error) {
              debugLog('Error fetching expenses in real-time:', error);
              return;
            }
            const expenses = data ? data.map(convertExpenseFromDB) : [];
            callback(expenses);
          } catch (error) {
            debugLog('Error in expense real-time callback:', error);
          }
        }
      )
      .subscribe();
  }
}
