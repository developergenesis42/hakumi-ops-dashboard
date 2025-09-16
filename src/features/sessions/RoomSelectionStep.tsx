import type { Room, Service, Session } from '@/types';

interface RoomSelectionStepProps {
  selectedService: Service | null;
  selectedRoom: Room | null;
  availableRooms: Room[];
  sessions: Session[];
  onSelectRoom: (room: Room) => void;
  isManualAdd?: boolean;
}

export default function RoomSelectionStep({ 
  selectedService, 
  selectedRoom, 
  availableRooms, 
  sessions, 
  onSelectRoom,
  isManualAdd = false
}: RoomSelectionStepProps) {
  if (availableRooms.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Room</h3>
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-medium mb-2">
            No Available Rooms
          </div>
          <div className="text-gray-600 text-sm">
            All rooms are currently busy.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Room</h3>
      <div className="grid grid-cols-2 gap-3">
        {availableRooms.map((room) => {
          const isRoomInUse = sessions.some(session => 
            session.roomId === room.id && session.status === 'in_progress'
          );
          const isDisabled = isManualAdd ? false : isRoomInUse;
          
          const isFallbackRoom = selectedService?.category === 'Single' && 
            selectedService?.roomType === 'Shower' && 
            room.type === 'VIP Jacuzzi';
          
          return (
            <button
              key={room.id}
              onClick={() => !isDisabled && onSelectRoom(room)}
              disabled={isDisabled}
              className={`p-4 border rounded-lg text-left transition-colors ${
                isDisabled
                  ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                  : selectedRoom?.id === room.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                {isFallbackRoom ? `${room.name}X` : room.name}
              </div>
              <div className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                {isFallbackRoom ? `${room.type} (Shower Only)` : room.type}
              </div>
              {isDisabled && (
                <div className="text-xs text-red-500 mt-1 font-medium">
                  Currently in use
                </div>
              )}
              {isFallbackRoom && !isDisabled && (
                <div className="text-xs text-orange-600 mt-1 font-medium">
                  Use as shower room only
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
