import React, { useState, useEffect } from 'react';
import { ViewType, OrigamiSlot, SlotTemplate } from './types';
import { ORIGAMI_CONFIG, parseOrigamiTemplates, generateSlotsForRange, addDays, getStartOfWeek, getDaysInMonth } from './utils';
import ViewControls from './components/ViewControls';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [events, setEvents] = useState<OrigamiSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  // 1. Fetch Templates once on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 2. Generate Events whenever templates, current date, or view changes
  useEffect(() => {
    if (templates.length === 0) return;

    let start: Date, end: Date;

    if (view === 'day') {
      start = new Date(currentDate);
      end = new Date(currentDate);
    } else if (view === 'week') {
      start = getStartOfWeek(currentDate);
      end = addDays(start, 6);
    } else { // month
      const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
      start = days[0];
      end = days[days.length - 1];
    }

    const generated = generateSlotsForRange(templates, start, end);
    setEvents(generated);

  }, [templates, currentDate, view]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    setErrorHint(null);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_data_name: ORIGAMI_CONFIG.dataName,
        }),
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         const errorMsg = errorData.error?.message || errorData.error || `API Error ${response.status}`;
         
         if (errorData.error?.hint) {
             setErrorHint(errorData.error.hint);
         }
         
         throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
      
      const rawData = await response.json();
      
      // DEBUG: Log the raw data to console so we can see the structure
      console.log('--- ORIGAMI RAW DATA ---');
      console.log(rawData);
      if (rawData.instanceList && rawData.instanceList.length > 0) {
          console.log('Sample Item Keys:', Object.keys(rawData.instanceList[0]));
          console.log('Searching for:', ORIGAMI_CONFIG.fields);
      }
      console.log('------------------------');

      if (rawData.error) {
          let msg = rawData.error;
          if (typeof rawData.error === 'object') {
              msg = rawData.error.message || JSON.stringify(rawData.error);
          }
          throw new Error(msg);
      }
      
      const parsedTemplates = parseOrigamiTemplates(rawData);
      console.log('Parsed Templates:', parsedTemplates);
      
      setTemplates(parsedTemplates);
      
      if (parsedTemplates.length === 0) {
          console.warn('No templates found. Please check the Console for the "ORIGAMI RAW DATA" log and verify field names.');
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load schedule templates');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (view === 'month') {
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setCurrentDate(nextMonth);
    }
  };

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else if (view === 'month') {
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        setCurrentDate(prevMonth);
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  const getDateLabel = () => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    if (view === 'day') options.day = 'numeric';
    return currentDate.toLocaleDateString('he-IL', options);
  };

  const handleSlotClick = (slot: OrigamiSlot) => {
    alert(`פרטי סלוט:\nהתחלה: ${new Date(slot.startTime).toLocaleString('he-IL')}\nסיום: ${new Date(slot.endTime).toLocaleString('he-IL')}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center md:text-right">
          <h1 className="text-3xl font-bold text-gray-900">יומן פגישות</h1>
          <p className="text-gray-500 mt-1">ניהול סלוטים מתוך אוריגמי</p>
        </header>

        <ViewControls 
          currentView={view} 
          onViewChange={setView}
          onNext={handleNext}
          onPrev={handlePrev}
          onToday={handleToday}
          dateLabel={getDateLabel()}
        />

        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200 text-right">
                <p><strong>שגיאה בטעינת הנתונים:</strong> {error}</p>
                {errorHint && <p className="text-sm mt-2 opacity-80" dir="ltr">{errorHint}</p>}
            </div>
        )}

        {loading && templates.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {view === 'month' && <MonthView currentDate={currentDate} events={events} onSlotClick={handleSlotClick} />}
            {view === 'week' && <WeekView currentDate={currentDate} events={events} onSlotClick={handleSlotClick} />}
            {view === 'day' && <DayView currentDate={currentDate} events={events} onSlotClick={handleSlotClick} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;