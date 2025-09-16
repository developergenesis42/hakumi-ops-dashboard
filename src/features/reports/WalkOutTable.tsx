import { useApp } from '@/hooks/useApp';
import type { WalkOutReason } from '@/types';

// Color mapping for walk-out reasons
const getReasonColor = (reason: WalkOutReason) => {
  switch (reason) {
    case 'No Rooms':
      return 'bg-red-600';
    case 'No Ladies':
      return 'bg-pink-600';
    case 'Price Too High':
      return 'bg-yellow-500';
    case 'Client Too Picky':
      return 'bg-orange-500';
    case 'Chinese':
      return 'bg-blue-600';
    case 'Laowai':
      return 'bg-purple-600';
    default:
      return 'bg-gray-500';
  }
};

// Inline style mapping for fallback
const getReasonStyle = (reason: WalkOutReason) => {
  switch (reason) {
    case 'No Rooms':
      return { backgroundColor: '#dc2626' }; // red-600
    case 'No Ladies':
      return { backgroundColor: '#db2777' }; // pink-600
    case 'Price Too High':
      return { backgroundColor: '#eab308' }; // yellow-500
    case 'Client Too Picky':
      return { backgroundColor: '#f97316' }; // orange-500
    case 'Chinese':
      return { backgroundColor: '#2563eb' }; // blue-600
    case 'Laowai':
      return { backgroundColor: '#9333ea' }; // purple-600
    default:
      return { backgroundColor: '#6b7280' }; // gray-500
  }
};

export default function WalkOutTable() {
  const { state } = useApp();

  if (state.walkOuts.length === 0) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg">
        <p className="text-gray-400 text-center">No walk-outs recorded today</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-slate-700 border-b border-slate-600">
        <h3 className="text-lg font-semibold text-white">Walk-Out History</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                People
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {state.walkOuts.map((walkOut, index) => (
              <tr key={walkOut.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm text-white font-medium">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {walkOut.count || 1}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {walkOut.timestamp.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-center">
                    <span 
                      className={`inline-flex w-4 h-4 ${getReasonColor(walkOut.reason)} rounded-full border border-white/30`}
                      style={getReasonStyle(walkOut.reason)}
                      title={walkOut.reason}
                    ></span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-4 bg-slate-700 border-t border-slate-600">
        {/* End of Day Summary */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-3">End of Day Summary</h4>
          
          {/* Summary Statistics */}
          <div className="flex justify-between items-center text-sm text-white mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total Incidents:</span>
              <span className="bg-slate-600 px-2 py-1 rounded text-white font-bold">{state.walkOuts.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Total People:</span>
              <span className="bg-slate-600 px-2 py-1 rounded text-white font-bold">{state.walkOuts.reduce((sum, wo) => sum + (wo.count || 1), 0)}</span>
            </div>
          </div>
          
          {/* Reason Legend */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-300 uppercase tracking-wider">Reason Legend</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex w-4 h-4 ${getReasonColor('No Rooms')} rounded-full border border-white/30`}
                  style={getReasonStyle('No Rooms')}
                ></span>
                <span className="text-xs text-gray-300">No Rooms</span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex w-4 h-4 ${getReasonColor('No Ladies')} rounded-full border border-white/30`}
                  style={getReasonStyle('No Ladies')}
                ></span>
                <span className="text-xs text-gray-300">No Ladies</span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex w-4 h-4 ${getReasonColor('Price Too High')} rounded-full border border-white/30`}
                  style={getReasonStyle('Price Too High')}
                ></span>
                <span className="text-xs text-gray-300">Price Too High</span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex w-4 h-4 ${getReasonColor('Client Too Picky')} rounded-full border border-white/30`}
                  style={getReasonStyle('Client Too Picky')}
                ></span>
                <span className="text-xs text-gray-300">Client Too Picky</span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex w-4 h-4 ${getReasonColor('Chinese')} rounded-full border border-white/30`}
                  style={getReasonStyle('Chinese')}
                ></span>
                <span className="text-xs text-gray-300">Chinese</span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className={`inline-flex w-4 h-4 ${getReasonColor('Laowai')} rounded-full border border-white/30`}
                  style={getReasonStyle('Laowai')}
                ></span>
                <span className="text-xs text-gray-300">Laowai</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
