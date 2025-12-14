import React from 'react';
import { OrigamiSlot } from '../types';
import { isSameDate, formatTime } from '../utils';

interface DayViewProps {
  currentDate: Date;
  events: OrigamiSlot[];
  onSlotClick?: (slot: OrigamiSlot) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DayView: React.FC<DayViewProps> = ({ currentDate, events, onSlotClick }) => {
  const dayEvents = events.filter(e => isSameDate(new Date(e.startTime), currentDate));

  const getEventStyle = (event: OrigamiSlot) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const durationMinutes = endMinutes - startMinutes;

    return {
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${(durationMinutes / 1440) * 100}%`,
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px] overflow-hidden">
      <div className="py-4 text-center bg-gray-50 border-b border-gray-200 font-bold text-gray-800">
          {currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      <div className="flex-1 overflow-y-auto relative no-scrollbar">
         <div className="relative min-h-[1000px] flex">
             {/* Time Axis */}
             <div className="w-16 flex-none border-l border-gray-200 bg-white relative">
                 {HOURS.map(hour => (
                    <div key={hour} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2" style={{ top: `${(hour / 24) * 100}%` }}>
                        {hour}:00
                    </div>
                ))}
             </div>

             {/* Events Area */}
             <div className="flex-1 relative">
                {HOURS.map(hour => (
                        <div key={hour} className="absolute w-full border-t border-gray-100" style={{ top: `${(hour / 24) * 100}%` }}></div>
                ))}
                
                {dayEvents.map(event => (
                     <div
                        key={event.id}
                        onClick={() => onSlotClick && onSlotClick(event)}
                        className="absolute left-2 right-2 bg-blue-100 border-l-4 border-blue-500 text-blue-900 rounded p-2 text-sm overflow-hidden cursor-pointer hover:bg-blue-200 z-10 shadow-sm"
                        style={getEventStyle(event)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}</span>
                        </div>
                        <div className="mt-1">{event.title}</div>
                    </div>
                ))}
             </div>
         </div>
      </div>
    </div>
  );
};

export default DayView;
