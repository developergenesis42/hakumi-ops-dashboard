-- Migration: Add expenses table and related functionality
-- Run this in your Supabase SQL editor after the master schema

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN (
        'Condom 12', 'Condom 24', 'Condom 36', 'Condom 48',
        'Lube', 'Towel', 'Other'
    )),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints for data integrity
    CONSTRAINT expenses_description_not_empty CHECK (
        description IS NULL OR LENGTH(TRIM(description)) > 0
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_therapist_id ON expenses(therapist_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_therapist_date ON expenses(therapist_id, date);

-- Create updated_at trigger for expenses
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for expenses
CREATE POLICY "Allow all operations on expenses" ON expenses FOR ALL USING (true);
