import { formatTime, formatWorkingHours } from '@/utils/workingHours';
import type { Therapist } from '@/types';

interface AttendanceRecord {
  therapistId: string;
  therapistName: string;
  checkInTime: Date;
  departureTime?: Date;
  workingHours?: number;
  synced: boolean;
}

interface WorkingHoursSummaryProps {
  todayAttendance: {
    records: AttendanceRecord[];
    totalWorkingHours: number;
  };
  todayRoster: Therapist[];
  onRetrySyncs: () => Promise<void>;
  onExportData: () => void;
}

export default function WorkingHoursSummary({ 
  todayAttendance, 
  todayRoster, 
  onRetrySyncs, 
  onExportData 
}: WorkingHoursSummaryProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Working Hours & Attendance Summary</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await onRetrySyncs();
                alert('Sync retry completed!');
              } catch (error) {
                alert('Failed to retry syncs: ' + error);
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Retry Syncs
          </button>
          <button
            onClick={onExportData}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>
      
      {/* Attendance Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-sm text-gray-300">Checked In</div>
          <div className="text-lg font-bold text-white">{todayAttendance.records.length}</div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-sm text-gray-300">Still Working</div>
          <div className="text-lg font-bold text-green-400">
            {todayAttendance.records.filter(r => !r.departureTime).length}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-sm text-gray-300">Total Hours</div>
          <div className="text-lg font-bold text-blue-400">
            {formatWorkingHours(todayAttendance.totalWorkingHours)}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="text-sm text-gray-300">Synced</div>
          <div className="text-lg font-bold text-green-400">
            {todayAttendance.records.filter(r => r.synced).length}/{todayAttendance.records.length}
          </div>
        </div>
      </div>
      
      {todayAttendance.records.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No therapists checked in today</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Therapist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Check-In Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Departure Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Working Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Sync Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {todayAttendance.records.map((attendanceRecord) => {
                // Find the corresponding therapist from the roster
                const therapist = todayRoster.find(t => t.id === attendanceRecord.therapistId);
                if (!therapist) return null;
                
                // Calculate working hours for this therapist
                const workingHours = attendanceRecord.departureTime 
                  ? attendanceRecord.workingHours || 0
                  : Math.round((new Date().getTime() - attendanceRecord.checkInTime.getTime()) / (1000 * 60));
                
                return (
                  <tr key={therapist.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {attendanceRecord.therapistName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatTime(attendanceRecord.checkInTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {attendanceRecord.departureTime ? formatTime(attendanceRecord.departureTime) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <span className="font-semibold text-green-400">
                        {formatWorkingHours(workingHours)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        attendanceRecord.departureTime 
                          ? 'bg-gray-900 text-gray-300' 
                          : therapist.status === 'in-session'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {attendanceRecord.departureTime ? 'Leave Work' : 
                         therapist.status === 'in-session' ? 'Working Now' : 'Available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        attendanceRecord.synced 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {attendanceRecord.synced ? 'Synced' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
