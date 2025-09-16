import * as React from 'react';
import { useApp } from '@/hooks/useApp';
import { useFieldValidation } from '@/hooks/useValidation';
import { ValidationRules } from '@/utils/validation';
import type { WalkOut, WalkOutReason } from '@/types';
import { generateId } from '@/utils/helpers';
import { WalkoutService } from '@/services/walkoutService';
import { WalkOutTable } from '@/shared/components/LazyComponents';

function SidePanel() {
  const { state, dispatch } = useApp();
  const [selectedReason, setSelectedReason] = React.useState<WalkOutReason>('No Rooms');
  
  // Use validation hook for walk-out count
  const walkOutCountValidation = useFieldValidation('', ValidationRules.walkOutCount);

  const handleAddWalkOut = React.useCallback(async () => {
    // Validate the input before proceeding
    const isValid = walkOutCountValidation.validate();
    
    if (!isValid) {
      return; // Don't proceed if validation fails
    }

    const count = parseInt(String(walkOutCountValidation.value));
    if (count > 0) {
      const walkOut: Omit<WalkOut, 'id'> = {
        sessionId: '',
        therapistIds: [],
        service: null, // Simple walkout count, no service needed
        totalAmount: 0,
        timestamp: new Date(),
        count,
        reason: selectedReason
      };

      try {
        // Save to database and localStorage
        const createdWalkOut = await WalkoutService.createWalkOut(walkOut);
        
        // Update the app state
        dispatch({ type: 'ADD_WALK_OUT', payload: createdWalkOut });
        walkOutCountValidation.setValue(''); // Clear the input after adding
      } catch (error) {
        console.error('Failed to save walkout:', error);
        // Still add to local state even if database save fails
        const walkOutWithId = {
          ...walkOut,
          id: generateId()
        };
        dispatch({ type: 'ADD_WALK_OUT', payload: walkOutWithId });
        walkOutCountValidation.setValue(''); // Clear the input after adding
      }
    }
  }, [walkOutCountValidation, selectedReason, dispatch]);

  // Memoized room filtering
  const roomCategories = React.useMemo(() => ({
    shower: (state.rooms || []).filter(r => r.type === 'Shower'),
    vipJacuzzi: (state.rooms || []).filter(r => r.type === 'VIP Jacuzzi'),
    doubleBedShower: (state.rooms || []).filter(r => r.type === 'Double Bed Shower (large)'),
    singleBedShower: (state.rooms || []).filter(r => r.type === 'Single Bed Shower (large)')
  }), [state.rooms]);

  // Memoized roster statistics
  const rosterStats = React.useMemo(() => ({
    total: (state.todayRoster || []).length,
    checkedIn: (state.todayRoster || []).filter(t => t.status === 'available' || t.status === 'in-session').length,
    inSession: (state.todayRoster || []).filter(t => t.status === 'in-session').length,
    available: (state.todayRoster || []).filter(t => t.status === 'available').length
  }), [state.todayRoster]);

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 p-6">
      {/* Rooms Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-100">Rooms</h2>
        </div>

        {/* Room Categories */}
        <div className="space-y-4">
          {/* Standard Shower Rooms */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Shower</h3>
            <div className="flex gap-2">
              {roomCategories.shower.map((room) => (
                <button
                  key={room.id}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    room.status === 'available' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {room.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* VIP Jacuzzi Rooms */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">VIP Jacuzzi</h3>
            <div className="flex gap-2">
              {roomCategories.vipJacuzzi.map((room) => (
                <button
                  key={room.id}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    room.status === 'available' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {room.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Large Shower Rooms */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Large Showers</h3>
            <div className="flex gap-2">
              {roomCategories.doubleBedShower.map((room) => (
                <button
                  key={room.id}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    room.status === 'available' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {room.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Large Showers</h3>
            <div className="flex gap-2">
              {roomCategories.singleBedShower.map((room) => (
                <button
                  key={room.id}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    room.status === 'available' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {room.name.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Roster Statistics Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-100">Roster Status</h2>
        </div>
        
        {/* Roster Statistics */}
        <div className="space-y-3">
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Total on Roster:</span>
              <span className="text-lg font-semibold text-white">{rosterStats.total}</span>
            </div>
          </div>
          
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Checked In:</span>
              <span className="text-lg font-semibold text-green-400">
                {rosterStats.checkedIn}
              </span>
            </div>
          </div>
          
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Working Now:</span>
              <span className="text-lg font-semibold text-blue-400">
                {rosterStats.inSession}
              </span>
            </div>
          </div>
          
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Available:</span>
              <span className="text-lg font-semibold text-yellow-400">
                {rosterStats.available}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Walk-Outs Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-100">Walk-Outs</h2>
        </div>
        
        {/* Walk-Out Input */}
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={String(walkOutCountValidation.value)}
              onChange={(e) => walkOutCountValidation.setValue(e.target.value)}
              onBlur={() => walkOutCountValidation.setTouched()}
              placeholder="# of people"
              className={`flex-1 px-3 py-2 bg-gray-800 border rounded text-white placeholder-gray-400 focus:outline-none ${
                walkOutCountValidation.touched && walkOutCountValidation.error
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-gray-600 focus:border-gray-500'
              }`}
            />
            <button
              onClick={handleAddWalkOut}
              disabled={!walkOutCountValidation.isValid || !walkOutCountValidation.value}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Log
            </button>
          </div>
          
          {/* Validation Error Display */}
          {walkOutCountValidation.touched && walkOutCountValidation.error && (
            <div className="text-red-400 text-sm">
              {walkOutCountValidation.error}
            </div>
          )}
          
          {/* Reason Selection */}
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as WalkOutReason)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-gray-500"
          >
            <option value="No Rooms">No Rooms</option>
            <option value="No Ladies">No Ladies</option>
            <option value="Price Too High">Price Too High</option>
            <option value="Client Too Picky">Client Too Picky</option>
            <option value="Chinese">Chinese</option>
            <option value="Laowai">Laowai</option>
          </select>
        </div>

        {/* Walk-Out Table */}
        <WalkOutTable />
      </div>


    </div>
  );
}

export default React.memo(SidePanel);
