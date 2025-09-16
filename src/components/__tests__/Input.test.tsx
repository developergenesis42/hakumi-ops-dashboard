import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/shared/components/ui/Input';

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('w-full', 'px-4', 'py-3', 'border', 'rounded-lg');
  });

  it('should render with label', () => {
    render(<Input label="Test Label" placeholder="Enter text" id="test-input" />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<Input error="This field is required" placeholder="Enter text" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-400');
  });

  it('should apply error styling when error is present', () => {
    render(<Input error="Error message" placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
  });

  it('should render with left icon', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    render(<Input leftIcon={leftIcon} placeholder="Search" />);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveClass('pl-10');
  });

  it('should render with right icon', () => {
    const rightIcon = <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={rightIcon} placeholder="Enter text" />);
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('pr-10');
  });

  it('should render with both left and right icons', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    const rightIcon = <span data-testid="right-icon">✓</span>;
    render(<Input leftIcon={leftIcon} rightIcon={rightIcon} placeholder="Search" />);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Search');
    expect(input).toHaveClass('pl-10', 'pr-10');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-class" placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('custom-class');
  });

  it('should handle input events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test input');
  });

  it('should forward ref correctly', () => {
    const ref = jest.fn();
    render(<Input ref={ref} placeholder="Enter text" />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should pass through other props', () => {
    render(<Input data-testid="custom-input" type="email" placeholder="Enter email" />);
    
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
  });

  it('should have correct focus styles', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500/20');
  });

  it('should have correct base styling', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('w-full', 'px-4', 'py-3', 'border', 'rounded-lg', 'transition-all', 'duration-200');
  });

  it('should have correct theme colors', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('text-white', 'placeholder-gray-400', 'focus:border-blue-500');
  });

  it('should render label with correct styling', () => {
    render(<Input label="Test Label" placeholder="Enter text" />);
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-300', 'mb-2');
  });

  it('should render error message with correct styling', () => {
    render(<Input error="Error message" placeholder="Enter text" />);
    
    const errorMessage = screen.getByText('Error message');
    expect(errorMessage).toHaveClass('mt-1', 'text-sm', 'text-red-400');
  });

  it('should position left icon correctly', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    render(<Input leftIcon={leftIcon} placeholder="Search" />);
    
    const iconSpan = screen.getByTestId('left-icon');
    // The parent div should have the positioning classes
    const iconContainer = iconSpan.closest('div');
    expect(iconContainer).toHaveClass('absolute', 'inset-y-0', 'left-0', 'pl-3', 'flex', 'items-center', 'pointer-events-none');
    // The span should be inside the container
    expect(iconContainer).toContainElement(iconSpan);
  });

  it('should position right icon correctly', () => {
    const rightIcon = <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={rightIcon} placeholder="Enter text" />);
    
    const iconSpan = screen.getByTestId('right-icon');
    // The parent div should have the positioning classes
    const iconContainer = iconSpan.closest('div');
    expect(iconContainer).toHaveClass('absolute', 'inset-y-0', 'right-0', 'pr-3', 'flex', 'items-center', 'pointer-events-none');
    // The span should be inside the container
    expect(iconContainer).toContainElement(iconSpan);
  });

  it('should handle disabled state', () => {
    render(<Input disabled placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeDisabled();
  });

  it('should handle required attribute', () => {
    render(<Input required placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeRequired();
  });

  it('should handle different input types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text input" />);
    expect(screen.getByPlaceholderText('Text input')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" placeholder="Password input" />);
    expect(screen.getByPlaceholderText('Password input')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" placeholder="Email input" />);
    expect(screen.getByPlaceholderText('Email input')).toHaveAttribute('type', 'email');
  });
});
