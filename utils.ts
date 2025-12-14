import { OrigamiSlot } from './types';

// Constants for Origami Fields
export const ORIGAMI_CONFIG = {
  dataName: 'e_90',
  fields: {
    start: 'fld_1544',
    end: 'fld_1545',
  }
};

/**
 * Parses raw Origami data into structured slots.
 * Assumes Origami returns Unix timestamps (seconds or milliseconds) or ISO strings.
 */
export const parseOrigamiData = (data: any[]): OrigamiSlot[] => {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    // Helper to find field value deeply nested or flat
    const findField = (fieldName: string): any => {
      // 1. Try flat
      if (item[fieldName]) return item[fieldName];
      
      // 2. Try inside groups (g_...)
      const keys = Object.keys(item);
      for (const key of keys) {
        if (key.startsWith('g_') && typeof item[key] === 'object' && item[key] !== null) {
          if (item[key][fieldName]) return item[key][fieldName];
        }
      }
      return null;
    };

    const rawStart = findField(ORIGAMI_CONFIG.fields.start);
    const rawEnd = findField(ORIGAMI_CONFIG.fields.end);

    // Parse Dates
    // Origami often uses Unix Timestamps in seconds. React uses milliseconds.
    const parseTime = (val: any): number => {
      if (!val) return 0;
      // If string looks like a number
      if (!isNaN(Number(val))) {
        let num = Number(val);
        // Heuristic: If timestamp is small (seconds), convert to ms
        if (num < 10000000000) {
            num = num * 1000;
        }
        return num;
      }
      // Try date string
      const d = new Date(val);
      return d.getTime();
    };

    const startTime = parseTime(rawStart);
    const endTime = parseTime(rawEnd);

    return {
      id: item._id || item.id || Math.random().toString(),
      startTime,
      endTime,
      title: 'פגישה', // Default title
      originalData: item
    };
  }).filter(s => s.startTime > 0 && s.endTime > 0);
};

// --- Date Helpers ---

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isSameDate = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateFull = (date: Date): string => {
    return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
};
