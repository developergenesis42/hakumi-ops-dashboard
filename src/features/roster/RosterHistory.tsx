import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { dailyResetService } from '@/services/dailyResetService';
import { rosterService } from '@/services/rosterService';
import { THEME_COLORS } from '@/constants';
import type { Therapist } from '@/types';

interface RosterHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArchivedRoster {
  date: string;
  roster: Therapist[];
  archivedAt: string;
}

export default function RosterHistory({ isOpen, onClose }: RosterHistoryProps) {
  const [archivedRosters, setArchivedRosters] = useState<ArchivedRoster[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRoster, setSelectedRoster] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadArchivedRosters();
    }
  }, [isOpen]);

  const loadArchivedRosters = () => {
    const archived = dailyResetService.getArchivedRosters(30);
    setArchivedRosters(archived as ArchivedRoster[]);
  };

  const handleDateSelect = async (date: string) => {
    setLoading(true);
    try {
      const roster = await rosterService.getRosterForDate(date);
      setSelectedDate(date);
      setSelectedRoster(roster);
    } catch (error) {
      logger.error('Failed to load roster for date:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'in-session': return 'text-blue-400';
      case 'departed': return 'text-gray-400';
      case 'inactive': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${THEME_COLORS.PRIMARY.background} rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Roster History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Date List */}
          <div className="overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Past Rosters</h3>
            <div className="space-y-2">
              {archivedRosters.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No archived rosters found
                </div>
              ) : (
                archivedRosters.map((archived) => (
                  <button
                    key={archived.date}
                    onClick={() => handleDateSelect(archived.date)}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      selectedDate === archived.date
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-white font-medium">
                      {formatDate(archived.date)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {archived.roster.length} therapists
                    </div>
                    <div className="text-xs text-gray-500">
                      Archived: {new Date(archived.archivedAt).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Roster Details */}
          <div className="overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedDate ? `Roster for ${formatDate(selectedDate)}` : 'Select a date'}
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading roster...</div>
              </div>
            ) : selectedRoster.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                {selectedDate ? 'No roster data found for this date' : 'Select a date to view roster'}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedRoster.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{therapist.name}</div>
                          <div className="text-sm text-gray-400">
                            {therapist.totalSessions} sessions • ฿{therapist.totalEarnings.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(therapist.status)}`}>
                          {therapist.status.replace('-', ' ').toUpperCase()}
                        </div>
                        {therapist.checkInTime && (
                          <div className="text-xs text-gray-400">
                            Check-in: {new Date(therapist.checkInTime).toLocaleTimeString()}
                          </div>
                        )}
                        {therapist.departureTime && (
                          <div className="text-xs text-gray-400">
                            Departure: {new Date(therapist.departureTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
