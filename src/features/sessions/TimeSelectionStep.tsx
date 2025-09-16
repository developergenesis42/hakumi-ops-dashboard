import React from 'react';
import { Service } from '@/types';

interface TimeSelectionStepProps {
  selectedService: Service;
  startTime: Date;
  endTime: Date;
  onStartTimeChange: (time: Date) => void;
  onEndTimeChange: (time: Date) => void;
}

export default function TimeSelectionStep({
  selectedService,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange
}: TimeSelectionStepProps) {
  const formatTimeForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = new Date(e.target.value);
    onStartTimeChange(newStartTime);
    
    // Auto-calculate end time based on service duration
    const newEndTime = new Date(newStartTime.getTime() + selectedService.duration * 60 * 1000);
    onEndTimeChange(newEndTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = new Date(e.target.value);
    onEndTimeChange(newEndTime);
  };

  const calculateDuration = (start: Date, end: Date): number => {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  };

  const duration = calculateDuration(startTime, endTime);
  const expectedDuration = selectedService.duration;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Session Timing</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the start and end times for this session. The end time will be automatically calculated based on the service duration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Time */}
        <div>
          <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
          </label>
          <input
            id="start-time"
            type="datetime-local"
            value={formatTimeForInput(startTime)}
            onChange={handleStartTimeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-2">
            End Time
          </label>
          <input
            id="end-time"
            type="datetime-local"
            value={formatTimeForInput(endTime)}
            onChange={handleEndTimeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Duration Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Session Duration:</span>
          <span className={`text-sm font-medium ${
            duration === expectedDuration ? 'text-green-600' : 'text-orange-600'
          }`}>
            {duration} minutes
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">Expected Duration:</span>
          <span className="text-xs text-gray-500">{expectedDuration} minutes</span>
        </div>
        {duration !== expectedDuration && (
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ Duration doesn't match service duration. This may affect pricing calculations.
          </p>
        )}
      </div>

      {/* Quick Time Presets */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Presets</h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              onStartTimeChange(now);
              onEndTimeChange(new Date(now.getTime() + selectedService.duration * 60 * 1000));
            }}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => {
              const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
              onStartTimeChange(oneHourAgo);
              onEndTimeChange(new Date(oneHourAgo.getTime() + selectedService.duration * 60 * 1000));
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            1 Hour Ago
          </button>
          <button
            type="button"
            onClick={() => {
              const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
              onStartTimeChange(twoHoursAgo);
              onEndTimeChange(new Date(twoHoursAgo.getTime() + selectedService.duration * 60 * 1000));
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            2 Hours Ago
          </button>
        </div>
      </div>
    </div>
  );
}
