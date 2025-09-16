import React, { useMemo } from 'react';
import TherapistCard from '@/features/roster/TherapistCard';
import type { Therapist } from '@/types';

interface TherapistGridProps {
  therapists: Therapist[];
}

export const TherapistGrid = React.memo<TherapistGridProps>(({ therapists }) => {
  // Memoize the therapist cards to prevent unnecessary re-renders
  // Only re-render when the therapists array actually changes
  const therapistCards = useMemo(() => {
    return therapists.map((therapist) => (
      <TherapistCard key={therapist.id} therapist={therapist} />
    ));
  }, [therapists]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {therapistCards}
    </div>
  );
});

TherapistGrid.displayName = 'TherapistGrid';
