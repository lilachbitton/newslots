import React from 'react';
import { OrigamiSlot } from '../types';
import { getDaysInMonth, isSameDate, formatTime } from '../utils';

interface MonthViewProps {
  currentDate: Date;
  events: OrigamiSlot[];
  onSlotClick?: (slot: OrigamiSlot) => void;
}

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

const MonthView: React.FC<MonthViewProps> = ({ currentDate, events, onSlotClick }) => {
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  // Calculate padding days for the grid (to start on the correct weekday)
  const firstDayOfMonth = daysInMonth[0].getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="min-h-[120px] bg-gray-50/50 border-b border-l border-gray-100" />
        ))}
        
        {daysInMonth.map((day) => {
          const dayEvents = events.filter(e => isSameDate(new Date(e.startTime), day));
          const isToday = isSameDate(day, new Date());

          return (
            <div 
              key={day.toISOString()} 
              className={`min-h-[120px] p-2 border-b border-l border-gray-100 transition-colors hover:bg-blue-50/30 ${isToday ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {day.getDate()}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onSlotClick && onSlotClick(event)}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded border-l-2 border-blue-500 truncate cursor-pointer hover:opacity-80"
                    title={`${formatTime(new Date(event.startTime))} - ${event.title}`}
                  >
                    {formatTime(new Date(event.startTime))} {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
