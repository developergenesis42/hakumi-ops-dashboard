import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/shared/components/ui/Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render with title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <div>Small modal</div>
      </Modal>
    );
    expect(screen.getByText('Small modal').closest('.modal-content')).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="md">
        <div>Medium modal</div>
      </Modal>
    );
    expect(screen.getByText('Medium modal').closest('.modal-content')).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <div>Large modal</div>
      </Modal>
    );
    expect(screen.getByText('Large modal').closest('.modal-content')).toHaveClass('max-w-lg');

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="xl">
        <div>Extra large modal</div>
      </Modal>
    );
    expect(screen.getByText('Extra large modal').closest('.modal-content')).toHaveClass('max-w-xl');
  });

  it('should show close button by default', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const closeButton = screen.getByTitle('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('should hide close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByTitle('Close')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    fireEvent.click(screen.getByTitle('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    const backdrop = screen.getByText('Modal content').closest('.modal-backdrop');
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    fireEvent.click(screen.getByText('Modal content'));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when other keys are pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should set body overflow to hidden when opened', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body overflow when closed', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('should apply custom className', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
        <div>Modal content</div>
      </Modal>
    );

    const modalContent = screen.getByText('Modal content').closest('.modal-content');
    expect(modalContent).toHaveClass('custom-modal');
  });

  it('should have correct z-index', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    const backdrop = screen.getByText('Modal content').closest('.modal-backdrop');
    expect(backdrop).toHaveClass('z-50');
  });

  it('should have correct backdrop styling', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    const backdrop = screen.getByText('Modal content').closest('.modal-backdrop');
    expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-40');
  });

  it('should have correct modal content styling', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    const modalContent = screen.getByText('Modal content').closest('.modal-content');
    expect(modalContent).toHaveClass('bg-white', 'rounded-xl', 'shadow-2xl');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should not add event listeners when closed', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    );

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });
});
