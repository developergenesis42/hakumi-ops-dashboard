import type { Service } from '@/types';
import { formatCurrency } from '@/utils/helpers';

interface ServicePackageStepProps {
  selectedServiceCategory: 'Single' | 'Double' | 'Couple' | null;
  selectedService: Service | null;
  services: Service[];
  onSelectService: (service: Service) => void;
}

export default function ServicePackageStep({ 
  selectedServiceCategory, 
  selectedService, 
  services, 
  onSelectService 
}: ServicePackageStepProps) {
  if (!selectedServiceCategory) return null;

  const filteredServices = services.filter(service => service.category === selectedServiceCategory);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Package</h3>
      <div className="grid grid-cols-1 gap-3">
        {filteredServices.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelectService(service)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedService?.id === service.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">
                {service.description.replace(/\bSingle\s+/g, '').replace(/\bDouble\s+/g, '')}
              </div>
              <div className="text-sm text-gray-600">
                {service.duration} minutes • {formatCurrency(service.price)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Lady: {formatCurrency(service.ladyPayout)} • Shop: {formatCurrency(service.shopRevenue)}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
