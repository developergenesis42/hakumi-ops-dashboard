import { renderHook, act } from '@testing-library/react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

// Mock keyboard event type for tests - using React.KeyboardEvent
type MockKeyboardEvent = Partial<React.KeyboardEvent<Element>> & {
  key: string;
  preventDefault: jest.Mock;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  charCode: number;
  keyCode: number;
  which: number;
  code: string;
  repeat: boolean;
  isComposing: boolean;
  detail: number;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
  currentTarget: EventTarget & Element;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  target: EventTarget & Element;
  timeStamp: number;
  type: string;
  locale: string;
  location: number;
  view: Window;
  nativeEvent: KeyboardEvent;
  isDefaultPrevented: () => boolean;
  stopPropagation: () => void;
  isPropagationStopped: () => boolean;
  persist: () => void;
  getModifierState: (key: string) => boolean;
};

// Helper function to create mock keyboard events
const createMockKeyboardEvent = (key: string, preventDefault: jest.Mock): MockKeyboardEvent => {
  const mockElement = document.createElement('div');
  return {
    key,
    preventDefault,
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    charCode: 0,
    keyCode: 0,
    which: 0,
    code: key,
    repeat: false,
    isComposing: false,
    detail: 0,
    bubbles: false,
    cancelable: false,
    composed: false,
    currentTarget: mockElement as EventTarget & Element,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    target: mockElement as EventTarget & Element,
    timeStamp: Date.now(),
    type: 'keydown',
    locale: 'en-US',
    location: 0,
    view: window as Window,
    nativeEvent: new KeyboardEvent('keydown') as KeyboardEvent,
    isDefaultPrevented: jest.fn(() => false),
    stopPropagation: jest.fn(),
    isPropagationStopped: jest.fn(() => false),
    persist: jest.fn(),
    getModifierState: jest.fn(() => false),
  };
};

describe('useKeyboardNavigation', () => {
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];
  const mockOnSelect = jest.fn();
  const mockOnEscape = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with selectedIndex -1', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should handle ArrowDown navigation', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    // Start at -1, first ArrowDown should go to 0
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(0);

    // Second ArrowDown should go to 1
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(1);

    // Third ArrowDown should go to 2
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(2);

    // Fourth ArrowDown should wrap to 0
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('should handle ArrowUp navigation', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    // Start at -1, first ArrowUp should wrap to last item (2)
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowUp', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(2);

    // Second ArrowUp should go to 1
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowUp', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(1);

    // Third ArrowUp should go to 0
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowUp', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('should handle Enter key selection', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    // Navigate to first item
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(0);

    // Press Enter to select
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Enter', jest.fn()));
    });

    expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0], 0);
  });

  it('should not select when Enter is pressed with no selection', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    // Press Enter without selecting anything (selectedIndex is -1)
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Enter', jest.fn()));
    });

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should handle Escape key', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
        onEscape: mockOnEscape,
      })
    );

    // Navigate to an item first
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(0);

    // Press Escape
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Escape', jest.fn()));
    });

    expect(mockOnEscape).toHaveBeenCalled();
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should handle Escape key without onEscape callback', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    // Navigate to an item first
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(0);

    // Press Escape
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Escape', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: [],
        onSelect: mockOnSelect,
      })
    );

    // All navigation should be ignored
    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(-1);

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowUp', jest.fn()));
    });

    expect(result.current.selectedIndex).toBe(-1);

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Enter', jest.fn()));
    });

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('should call preventDefault for navigation keys', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    const preventDefault = jest.fn();

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowDown', preventDefault));
    });

    expect(preventDefault).toHaveBeenCalled();

    preventDefault.mockClear();

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('ArrowUp', preventDefault));
    });

    expect(preventDefault).toHaveBeenCalled();

    preventDefault.mockClear();

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Enter', preventDefault));
    });

    expect(preventDefault).toHaveBeenCalled();

    preventDefault.mockClear();

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Escape', preventDefault));
    });

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should handle setSelectedIndex', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    act(() => {
      result.current.setSelectedIndex(1);
    });

    expect(result.current.selectedIndex).toBe(1);
  });

  it('should handle resetSelection', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    // Set a selection first
    act(() => {
      result.current.setSelectedIndex(1);
    });

    expect(result.current.selectedIndex).toBe(1);

    // Reset selection
    act(() => {
      result.current.resetSelection();
    });

    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should ignore unknown keys', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        items: mockItems,
        onSelect: mockOnSelect,
      })
    );

    const preventDefault = jest.fn();

    act(() => {
      result.current.handleKeyDown(createMockKeyboardEvent('Space', preventDefault));
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(result.current.selectedIndex).toBe(-1);
  });
});
