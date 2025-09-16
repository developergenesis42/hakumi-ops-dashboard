import { formatCurrency } from '@/utils/helpers';
import type { Session, Therapist, Room } from '@/types';

interface SessionHistoryProps {
  sessions: Session[];
  todayRoster: Therapist[];
  rooms: Room[];
  onEditSession: (session: Session) => void;
  onReprintSession: (session: Session) => void;
}

export default function SessionHistory({ 
  sessions, 
  todayRoster, 
  rooms, 
  onEditSession, 
  onReprintSession 
}: SessionHistoryProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Today's Session History</h2>
      
      {sessions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No sessions recorded today</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Therapists
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {session.startTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {session.endTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {session.therapistIds.map(id => 
                      todayRoster.find(t => t.id === id)?.name || 'Unknown'
                    ).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {session.service.description.replace(/\bSingle\s+/g, '').replace(/\bDouble\s+/g, '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {rooms.find(r => r.id === session.roomId)?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatCurrency(session.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'in_progress' 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-green-900 text-green-300'
                    }`}>
                      {session.status === 'in_progress' ? 'In Progress' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <div className="flex gap-2">
                      {session.status === 'completed' && (
                        <>
                          <button
                            onClick={() => onEditSession(session)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                            title="Edit Session"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => onReprintSession(session)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                            title="Reprint Receipt"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
