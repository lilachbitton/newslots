import React from 'react';
import { ViewType } from '../types';

interface ViewControlsProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onNext: () => void;
  onPrev: () => void;
  onToday: () => void;
  dateLabel: string;
}

const ViewControls: React.FC<ViewControlsProps> = ({ 
  currentView, 
  onViewChange, 
  onNext, 
  onPrev, 
  onToday,
  dateLabel 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2">
        <button 
          onClick={onPrev} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transform rotate-180">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button 
          onClick={onToday}
          className="px-4 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          היום
        </button>
        <button 
          onClick={onNext} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transform rotate-180">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800 mr-4 min-w-[150px]">{dateLabel}</h2>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onViewChange('day')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentView === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          יומי
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentView === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          שבועי
        </button>
        <button
          onClick={() => onViewChange('month')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentView === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          חודשי
        </button>
      </div>
    </div>
  );
};

export default ViewControls;
