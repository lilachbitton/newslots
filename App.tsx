import React, { useState, useEffect } from 'react';
import { ViewType, OrigamiSlot } from './types';
import { ORIGAMI_CONFIG, parseOrigamiData, addDays } from './utils';
import ViewControls from './components/ViewControls';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [events, setEvents] = useState<OrigamiSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_data_name: ORIGAMI_CONFIG.dataName,
          normalized: 1,
          // You can add filtering params here if Origami supports filtering by date range to optimize
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      
      const rawData = await response.json();
      if (rawData.error) throw new Error(rawData.error);
      
      const parsedSlots = parseOrigamiData(rawData);
      setEvents(parsedSlots);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load schedule');
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
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">
                שגיאה בטעינת הנתונים: {error}
            </div>
        )}

        {loading ? (
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
