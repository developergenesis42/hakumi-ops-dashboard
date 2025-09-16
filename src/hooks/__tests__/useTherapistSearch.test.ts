import { renderHook, act } from '@testing-library/react';
import { useTherapistSearch } from '@/hooks/useTherapistSearch';
import type { Therapist } from '@/types';

describe('useTherapistSearch', () => {
  const mockTherapists: Therapist[] = [
    { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    { id: '2', name: 'Bob Smith', status: 'in-session', totalEarnings: 0, totalSessions: 0, expenses: [] },
    { id: '3', name: 'Charlie Brown', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    { id: '4', name: 'David Wilson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
  ];

  it('should initialize with empty search term', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredTherapists).toEqual(mockTherapists);
  });

  it('should filter therapists by name (single character)', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('A');
    });

    expect(result.current.searchTerm).toBe('A');
    expect(result.current.filteredTherapists).toEqual([
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });

  it('should filter therapists by name (multiple characters)', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('Smith');
    });

    expect(result.current.searchTerm).toBe('Smith');
    expect(result.current.filteredTherapists).toEqual([
      { id: '2', name: 'Bob Smith', status: 'in-session', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });

  it('should be case insensitive', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('alice');
    });

    expect(result.current.filteredTherapists).toEqual([
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });

  it('should return all therapists when search term is empty', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('Alice');
    });

    expect(result.current.filteredTherapists).toHaveLength(1);

    act(() => {
      result.current.setSearchTerm('');
    });

    expect(result.current.filteredTherapists).toEqual(mockTherapists);
  });

  it('should return all therapists when search term is only whitespace', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('   ');
    });

    expect(result.current.filteredTherapists).toEqual(mockTherapists);
  });

  it('should exclude therapists by ID', () => {
    const { result } = renderHook(() => 
      useTherapistSearch({ 
        therapists: mockTherapists, 
        excludeIds: ['1', '3'] 
      })
    );

    expect(result.current.filteredTherapists).toEqual([
      { id: '2', name: 'Bob Smith', status: 'in-session', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '4', name: 'David Wilson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });

  it('should exclude therapists by ID even when searching', () => {
    const { result } = renderHook(() => 
      useTherapistSearch({ 
        therapists: mockTherapists, 
        excludeIds: ['1', '3'] 
      })
    );

    act(() => {
      result.current.setSearchTerm('A');
    });

    // Should not include Alice Johnson (id: '1') even though she starts with 'A'
    expect(result.current.filteredTherapists).toEqual([]);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('Alice');
    });

    expect(result.current.searchTerm).toBe('Alice');
    expect(result.current.filteredTherapists).toHaveLength(1);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredTherapists).toEqual(mockTherapists);
  });

  it('should handle empty therapists array', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: [] }));

    act(() => {
      result.current.setSearchTerm('Alice');
    });

    expect(result.current.filteredTherapists).toEqual([]);
  });

  it('should handle partial matches', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('ohn');
    });

    expect(result.current.filteredTherapists).toEqual([
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });

  it('should handle no matches', () => {
    const { result } = renderHook(() => useTherapistSearch({ therapists: mockTherapists }));

    act(() => {
      result.current.setSearchTerm('xyz');
    });

    expect(result.current.filteredTherapists).toEqual([]);
  });

  it('should update filtered results when therapists change', () => {
    const { result, rerender } = renderHook(
      ({ therapists }) => useTherapistSearch({ therapists }),
      { initialProps: { therapists: mockTherapists } }
    );

    act(() => {
      result.current.setSearchTerm('Alice');
    });

    expect(result.current.filteredTherapists).toHaveLength(1);

    // Update therapists array
    const newTherapists: Therapist[] = [
      ...mockTherapists,
      { id: '5', name: 'Alice Cooper', status: 'available' as const, totalEarnings: 0, totalSessions: 0, expenses: [] },
    ];

    rerender({ therapists: newTherapists });

    expect(result.current.filteredTherapists).toHaveLength(2);
    expect(result.current.filteredTherapists).toEqual([
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '5', name: 'Alice Cooper', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });

  it('should update filtered results when excludeIds change', () => {
    const { result, rerender } = renderHook(
      ({ excludeIds }) => useTherapistSearch({ 
        therapists: mockTherapists, 
        excludeIds 
      }),
      { initialProps: { excludeIds: ['1'] } }
    );

    expect(result.current.filteredTherapists).toHaveLength(3);

    // Update excludeIds
    rerender({ excludeIds: ['1', '2'] });

    expect(result.current.filteredTherapists).toHaveLength(2);
    expect(result.current.filteredTherapists).toEqual([
      { id: '3', name: 'Charlie Brown', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '4', name: 'David Wilson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ]);
  });
});
