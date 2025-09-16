
interface ServiceCategoryStepProps {
  selectedServiceCategory: 'Single' | 'Double' | 'Couple' | null;
  onSelectCategory: (category: 'Single' | 'Double' | 'Couple') => void;
}

export default function ServiceCategoryStep({ 
  selectedServiceCategory, 
  onSelectCategory 
}: ServiceCategoryStepProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Package Category</h3>
      <div className="grid grid-cols-1 gap-3">
        {['Single', 'Double', 'Couple'].map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category as 'Single' | 'Double' | 'Couple')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              selectedServiceCategory === category
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">
              {category === 'Single' ? '1 Lady' : 
               category === 'Double' ? '2 Lady' : 'Couple Session'}
            </div>
            <div className="text-sm text-gray-600">
              {category === 'Single' ? '1 therapist' : 
               category === 'Double' ? '2 therapists' : 'Couple session'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
