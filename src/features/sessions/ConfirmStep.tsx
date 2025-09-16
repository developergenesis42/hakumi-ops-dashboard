import type { Service, Room, Therapist } from '@/types';
import { formatCurrency, roundToNearest5Minutes } from '@/utils/helpers';

interface ConfirmStepProps {
  selectedService: Service | null;
  selectedRoom: Room | null;
  selectedTherapist2: Therapist | null;
  therapist: Therapist;
  discount: number;
  startTime?: Date;
  endTime?: Date;
}

export default function ConfirmStep({ 
  selectedService, 
  selectedRoom, 
  selectedTherapist2, 
  therapist, 
  discount,
  startTime,
  endTime
}: ConfirmStepProps) {
  const totalPrice = selectedService ? selectedService.price - discount : 0;
  
  // Calculate session times - use provided times if available (manual add), otherwise calculate
  const sessionStartTime = startTime || (selectedService ? new Date(Date.now() + roundToNearest5Minutes(0) * 60000) : null);
  const sessionEndTime = endTime || (sessionStartTime && selectedService ? 
    new Date(sessionStartTime.getTime() + selectedService.duration * 60000) : null);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Session Details</h3>
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-800">Package:</span>
          <span className="font-medium text-gray-900">{selectedService?.description}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">Duration:</span>
          <span className="font-medium text-gray-900">{selectedService?.duration} minutes</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">Start Time:</span>
          <span className="font-medium text-gray-900">
            {sessionStartTime?.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">End Time:</span>
          <span className="font-medium text-gray-900">
            {sessionEndTime?.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">Room:</span>
          <span className="font-medium text-gray-900">{selectedRoom?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">Therapists:</span>
          <span className="font-medium text-gray-900">
            {selectedService?.category === 'Double' && selectedTherapist2
              ? `${therapist.name}, ${selectedTherapist2.name}`
              : therapist.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-800">Discount:</span>
          <span className="font-medium text-gray-900">{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-3 text-gray-900">
          <span>Total Price:</span>
          <span>{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
