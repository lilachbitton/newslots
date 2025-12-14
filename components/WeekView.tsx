import React from 'react';
import { OrigamiSlot } from '../types';
import { getStartOfWeek, addDays, isSameDate, formatTime } from '../utils';

interface WeekViewProps {
  currentDate: Date;
  events: OrigamiSlot[];
  onSlotClick?: (slot: OrigamiSlot) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onSlotClick }) => {
  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

  // Helper to position events
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
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 flex-none">
        <div className="p-4 border-l border-gray-200"></div> {/* Time axis header */}
        {weekDays.map((day) => {
             const isToday = isSameDate(day, new Date());
             return (
                <div key={day.toISOString()} className={`py-3 text-center border-l border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className="text-xs text-gray-500 font-medium">{day.toLocaleDateString('he-IL', { weekday: 'short' })}</div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{day.getDate()}</div>
                </div>
             );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="grid grid-cols-8 relative min-h-[1000px]"> {/* Min height to allow scrolling for hours */}
            
            {/* Time Axis */}
            <div className="border-l border-gray-200 bg-white relative">
                {HOURS.map(hour => (
                    <div key={hour} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2" style={{ top: `${(hour / 24) * 100}%` }}>
                        {hour}:00
                    </div>
                ))}
            </div>

            {/* Days Columns */}
            {weekDays.map((day) => {
                const dayEvents = events.filter(e => isSameDate(new Date(e.startTime), day));
                return (
                    <div key={day.toISOString()} className="relative border-l border-gray-100 hover:bg-gray-50/30 transition-colors">
                        {/* Horizontal Hour Lines */}
                        {HOURS.map(hour => (
                             <div key={hour} className="absolute w-full border-t border-gray-100" style={{ top: `${(hour / 24) * 100}%` }}></div>
                        ))}

                        {/* Events */}
                        {dayEvents.map(event => (
                            <div
                                key={event.id}
                                onClick={() => onSlotClick && onSlotClick(event)}
                                className="absolute inset-x-1 bg-blue-500/90 text-white rounded p-1 text-xs overflow-hidden cursor-pointer hover:bg-blue-600 z-10 shadow-sm border border-blue-400"
                                style={getEventStyle(event)}
                            >
                                <div className="font-bold">{formatTime(new Date(event.startTime))}</div>
                                <div className="truncate">{event.title}</div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
