import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/shared/components/ui/Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600'); // primary variant
    expect(button).toHaveClass('px-4 py-2'); // md size
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-white');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600');

    rerender(<Button variant="warning">Warning</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-yellow-600');

    rerender(<Button variant="error">Error</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-gray-300');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3 py-1.5', 'h-8');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4 py-2', 'h-10');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6 py-3', 'h-12');
  });

  it('should show loading state', () => {
    render(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    
    // Should show loading spinner
    const spinner = button.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with left icon', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Button leftIcon={leftIcon}>With Left Icon</Button>);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(<Button rightIcon={rightIcon}>With Right Icon</Button>);
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should not show right icon when loading', () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(<Button isLoading rightIcon={rightIcon}>Loading</Button>);
    
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('should be disabled when loading', () => {
    render(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not handle click events when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not handle click events when loading', () => {
    const handleClick = jest.fn();
    render(<Button isLoading onClick={handleClick}>Loading</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should forward ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>With Ref</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should pass through other props', () => {
    render(<Button data-testid="custom-button" type="submit">Submit</Button>);
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should have correct focus styles', () => {
    render(<Button>Focusable</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2');
  });

  it('should have correct hover styles for primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-blue-700');
  });

  it('should have correct focus ring color for primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('focus:ring-blue-500');
  });
});
