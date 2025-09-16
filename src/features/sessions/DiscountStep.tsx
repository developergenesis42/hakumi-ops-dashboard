import { useCallback } from 'react';
import type { Service } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { useFieldValidation } from '@/hooks/useValidation';
import { ValidationRules } from '@/utils/validation';

interface DiscountStepProps {
  selectedService: Service | null;
  discount: number;
  onDiscountChange: (discount: number) => void;
}

export default function DiscountStep({ 
  selectedService, 
  discount, 
  onDiscountChange 
}: DiscountStepProps) {
  const totalPrice = selectedService ? selectedService.price - discount : 0;

  // Validation for custom discount input
  const customDiscountValidation = useFieldValidation('', {
    ...ValidationRules.discount,
    max: selectedService?.price || 0,
    custom: (value: unknown) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
      
      if (value && (isNaN(numValue) || numValue < 0)) {
        return 'Discount must be a positive number';
      }
      
      if (value && selectedService && numValue > selectedService.price) {
        return `Discount cannot exceed package price (${formatCurrency(selectedService.price)})`;
      }
      
      return null;
    }
  });

  const handleCustomDiscountChange = useCallback((value: string) => {
    const numValue = parseFloat(value) || 0;
    customDiscountValidation.setValue(value);
    onDiscountChange(numValue);
  }, [customDiscountValidation, onDiscountChange]);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Discount (Optional)</h3>
      <div className="space-y-4">
        {/* Quick Discount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Discount Options
          </label>
          <div className="flex gap-2 mb-3">
            {[0, 200, 300].map((amount) => (
              <button
                key={amount}
                onClick={() => onDiscountChange(amount)}
                className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                  discount === amount
                    ? 'border-blue-500 bg-blue-100 text-gray-700 font-medium'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {amount === 0 ? 'No Discount' : `฿${amount}`}
              </button>
            ))}
          </div>
          
          {/* Manual Discount Input */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Custom Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max={selectedService?.price || 0}
                value={discount > 0 && ![0, 200, 300].includes(discount) ? discount : ''}
                onChange={(e) => handleCustomDiscountChange(e.target.value)}
                onBlur={() => customDiscountValidation.setTouched()}
                placeholder="Enter amount..."
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  customDiscountValidation.touched && customDiscountValidation.error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              <button
                onClick={() => {
                  onDiscountChange(0);
                  customDiscountValidation.setValue('');
                }}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
            
            {/* Validation Error Display */}
            {customDiscountValidation.touched && customDiscountValidation.error && (
              <div className="mt-2 text-sm text-red-600">
                {customDiscountValidation.error}
              </div>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between text-sm text-gray-800">
            <span>Package Price:</span>
            <span>{formatCurrency(selectedService?.price || 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-800">
            <span>Discount:</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
          <div className="flex justify-between font-medium text-lg border-t border-gray-300 pt-2 mt-2 text-gray-900">
            <span>Total:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
