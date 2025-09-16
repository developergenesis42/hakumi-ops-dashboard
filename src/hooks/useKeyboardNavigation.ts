import { useState, useCallback } from 'react';

interface UseKeyboardNavigationProps<T = unknown> {
  items: T[];
  onSelect: (item: T, index: number) => void;
  onEscape?: () => void;
}

interface UseKeyboardNavigationReturn {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  resetSelection: () => void;
}

export function useKeyboardNavigation<T = unknown>({
  items,
  onSelect,
  onEscape,
}: UseKeyboardNavigationProps<T>): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onSelect(items[selectedIndex], selectedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        resetSelection();
        break;
    }
  }, [items, selectedIndex, onSelect, onEscape, resetSelection]);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    resetSelection,
  };
}
