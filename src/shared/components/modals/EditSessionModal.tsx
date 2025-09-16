import * as React from 'react';
import type { Session, Service, Room, Therapist } from '@/types';
import { formatCurrency } from '@/utils/helpers';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  services: Service[];
  rooms: Room[];
  therapists: Therapist[];
  onUpdate: (updatedSession: Session) => void;
}

export default function EditSessionModal({
  isOpen,
  onClose,
  session,
  services,
  rooms,
  therapists,
  onUpdate
}: EditSessionModalProps) {
  const [formData, setFormData] = React.useState({
    serviceId: '',
    roomId: '',
    therapistIds: [] as string[],
    discount: 0,
    startTime: '',
    endTime: ''
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form data when session changes
  React.useEffect(() => {
    if (session) {
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      
      setFormData({
        serviceId: session.service.id,
        roomId: session.roomId,
        therapistIds: session.therapistIds,
        discount: session.discount,
        startTime: startTime.toISOString().slice(0, 16), // Format for datetime-local input
        endTime: endTime.toISOString().slice(0, 16)
      });
      setErrors({});
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const selectedService = services.find(s => s.id === formData.serviceId);
  const selectedRoom = rooms.find(r => r.id === formData.roomId);

  // Calculate total price
  const servicePrice = selectedService?.price || 0;
  const totalPrice = Math.max(0, servicePrice - formData.discount);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceId) {
      newErrors.serviceId = 'Please select a package';
    }

    if (!formData.roomId) {
      newErrors.roomId = 'Please select a room';
    }

    if (formData.therapistIds.length === 0) {
      newErrors.therapistIds = 'Please select at least one therapist';
    }

    if (formData.discount < 0) {
      newErrors.discount = 'Discount cannot be negative';
    }

    if (formData.discount > servicePrice) {
      newErrors.discount = 'Discount cannot exceed package price';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Please select start time';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Please select end time';
    }

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (endTime <= startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!selectedService || !selectedRoom) {
      return;
    }

    const updatedSession: Session = {
      ...session,
      service: selectedService,
      roomId: formData.roomId,
      therapistIds: formData.therapistIds,
      discount: formData.discount,
      totalPrice: totalPrice,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime)
    };

    onUpdate(updatedSession);
  };

  const handleTherapistToggle = (therapistId: string) => {
    setFormData(prev => ({
      ...prev,
      therapistIds: prev.therapistIds.includes(therapistId)
        ? prev.therapistIds.filter(id => id !== therapistId)
        : [...prev.therapistIds, therapistId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package *
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                errors.serviceId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a package</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.description.replace(/\bSingle\s+/g, '').replace(/\bDouble\s+/g, '')} - {formatCurrency(service.price)}
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>
            )}
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room *
            </label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                errors.roomId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.type})
                </option>
              ))}
            </select>
            {errors.roomId && (
              <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
            )}
          </div>

          {/* Therapist Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Therapists *
            </label>
            <div className="space-y-2">
              {therapists.map(therapist => (
                <label key={therapist.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.therapistIds.includes(therapist.id)}
                    onChange={() => handleTherapistToggle(therapist.id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{therapist.name}</span>
                </label>
              ))}
            </div>
            {errors.therapistIds && (
              <p className="mt-1 text-sm text-red-600">{errors.therapistIds}</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount (THB)
            </label>
            <input
              type="number"
              min="0"
              max={servicePrice}
              value={formData.discount}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                errors.discount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.discount && (
              <p className="mt-1 text-sm text-red-600">{errors.discount}</p>
            )}
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Price Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Price:</span>
                <span className="font-medium text-gray-900">{formatCurrency(servicePrice)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(formData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2 text-gray-900">
                <span>Total Price:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
