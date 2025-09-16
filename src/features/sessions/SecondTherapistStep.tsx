import type { Therapist } from '@/types';

interface SecondTherapistStepProps {
  selectedTherapist2: Therapist | null;
  availableTherapists: Therapist[];
  onSelectTherapist2: (therapist: Therapist) => void;
}

export default function SecondTherapistStep({ 
  selectedTherapist2, 
  availableTherapists, 
  onSelectTherapist2 
}: SecondTherapistStepProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Second Therapist</h3>
      <div className="grid grid-cols-1 gap-3">
        {availableTherapists
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((therapist) => (
            <button
              key={therapist.id}
              onClick={() => onSelectTherapist2(therapist)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedTherapist2?.id === therapist.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{therapist.name}</div>
              <div className="text-sm text-gray-500">ID: {therapist.id}</div>
            </button>
          ))}
      </div>
    </div>
  );
}
