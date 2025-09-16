import { render, screen, fireEvent } from '@testing-library/react';
import ExpensesSummaryModal from '@/shared/components/modals/ExpensesSummaryModal';
import type { Therapist } from '@/types';

const mockTherapists: Therapist[] = [
  {
    id: '1',
    name: 'Therapist 1',
    status: 'available',
    totalEarnings: 0,
    totalSessions: 0,
    expenses: [
      { id: '1', type: 'Lube', amount: 160, description: 'Lube expense', timestamp: new Date(), therapistId: '1' },
      { id: '2', type: 'Towel', amount: 160, description: 'Towel expense', timestamp: new Date(), therapistId: '1' },
    ],
  },
  {
    id: '2',
    name: 'Therapist 2',
    status: 'available',
    totalEarnings: 0,
    totalSessions: 0,
    expenses: [
      { id: '3', type: 'Other', amount: 50, description: 'Other expense', timestamp: new Date(), therapistId: '2' },
      { id: '4', type: 'Lube', amount: 160, description: 'Lube expense', timestamp: new Date(), therapistId: '2' },
    ],
  },
];

describe('ExpensesSummaryModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <ExpensesSummaryModal
        isOpen={true}
        onClose={mockOnClose}
        therapists={mockTherapists}
      />
    );

    expect(screen.getByText('Daily Expenses Summary')).toBeInTheDocument();
    expect(screen.getByText('฿530')).toBeInTheDocument(); // Total expenses
  });

  it('does not render when closed', () => {
    render(
      <ExpensesSummaryModal
        isOpen={false}
        onClose={mockOnClose}
        therapists={mockTherapists}
      />
    );

    expect(screen.queryByText('Daily Expenses Summary')).not.toBeInTheDocument();
  });

  it('displays total expenses correctly', () => {
    render(
      <ExpensesSummaryModal
        isOpen={true}
        onClose={mockOnClose}
        therapists={mockTherapists}
      />
    );

    expect(screen.getByText('Total Expenses Today')).toBeInTheDocument();
    expect(screen.getByText('฿530')).toBeInTheDocument();
    expect(screen.getByText('Across 2 therapists')).toBeInTheDocument();
  });

  it('displays expenses by category', () => {
    render(
      <ExpensesSummaryModal
        isOpen={true}
        onClose={mockOnClose}
        therapists={mockTherapists}
      />
    );

    expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
    expect(screen.getByText('Mouthwash')).toBeInTheDocument();
    expect(screen.getByText('Body Soap')).toBeInTheDocument();
    expect(screen.getByText('Tissue')).toBeInTheDocument();
  });

  it('displays expenses by therapist', () => {
    render(
      <ExpensesSummaryModal
        isOpen={true}
        onClose={mockOnClose}
        therapists={mockTherapists}
      />
    );

    expect(screen.getByText('Expenses by Therapist')).toBeInTheDocument();
    expect(screen.getByText('Therapist 1')).toBeInTheDocument();
    expect(screen.getByText('Therapist 2')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ExpensesSummaryModal
        isOpen={true}
        onClose={mockOnClose}
        therapists={mockTherapists}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows no expenses message when therapists have no expenses', () => {
    const emptyTherapists: Therapist[] = [
      {
        id: '1',
        name: 'Therapist 1',
        status: 'available',
        totalEarnings: 0,
        totalSessions: 0,
        expenses: [],
      },
    ];

    render(
      <ExpensesSummaryModal
        isOpen={true}
        onClose={mockOnClose}
        therapists={emptyTherapists}
      />
    );

    expect(screen.getAllByText('No expenses recorded today')).toHaveLength(2);
    expect(screen.getByText('฿0')).toBeInTheDocument();
  });
});
