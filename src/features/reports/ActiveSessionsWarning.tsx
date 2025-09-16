import type { Session, Therapist, Room } from '@/types';

interface ActiveSessionsWarningProps {
  activeSessions: Session[];
  todayRoster: Therapist[];
  rooms: Room[];
}

export default function ActiveSessionsWarning({ activeSessions, todayRoster, rooms }: ActiveSessionsWarningProps) {
  if (activeSessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-yellow-400">Active Sessions Warning</h3>
          <div className="mt-2 text-yellow-300">
            <p>There are {activeSessions.length} active session(s) that need to be completed before ending the day:</p>
            <div className="mt-3 space-y-2">
              {activeSessions.map((session) => (
                <div key={session.id} className="text-sm bg-yellow-900/30 p-2 rounded">
                  <span className="font-medium text-yellow-200">
                    {session.therapistIds.map(id => 
                      todayRoster.find(t => t.id === id)?.name
                    ).join(', ')}
                  </span>
                  {' - '}
                  {session.service.description.replace(/\bSingle\s+/g, '').replace(/\bDouble\s+/g, '')}
                  {' in '}
                  {rooms.find(r => r.id === session.roomId)?.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
