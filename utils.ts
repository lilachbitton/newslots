import { OrigamiSlot } from './types';

// Constants for Origami Fields
export const ORIGAMI_CONFIG = {
  dataName: 'e_90',    // The main entity
  groupName: 'g_256',  // The field group from your screenshot
  fields: {
    start: 'fld_1544', // Start time
    end: 'fld_1545',   // End time
  }
};

/**
 * Parses raw Origami data into structured slots.
 * Handles:
 * 1. Flat structure (fields on root)
 * 2. Nested Groups (fields inside g_256)
 * 3. Repeating Groups (g_256 is an array of slots)
 */
export const parseOrigamiData = (data: any): OrigamiSlot[] => {
  let list = data;

  // Handle common Origami response wrappers where data is inside "instanceList"
  if (!Array.isArray(data) && data && Array.isArray(data.instanceList)) {
      list = data.instanceList;
  }

  if (!Array.isArray(list)) return [];

  const slots: OrigamiSlot[] = [];

  list.forEach((item) => {
    // 1. Try to find the specific group defined in config
    const groupData = item[ORIGAMI_CONFIG.groupName];

    // Helper to process a single data object (row) and extract time
    const processRow = (row: any, parentItem: any): OrigamiSlot | null => {
        const rawStart = row[ORIGAMI_CONFIG.fields.start];
        const rawEnd = row[ORIGAMI_CONFIG.fields.end];

        if (!rawStart || !rawEnd) return null;

        const startTime = parseTime(rawStart);
        const endTime = parseTime(rawEnd);

        if (startTime === 0 || endTime === 0) return null;

        return {
          id: row._id || row.id || Math.random().toString(36).substr(2, 9),
          startTime,
          endTime,
          title: row.title || 'פגישה', // You might want to map a specific title field later
          originalData: { ...parentItem, _groupRow: row }
        };
    };

    // Case A: The group is a Repeating Group (Array) - Multiple slots per item
    if (Array.isArray(groupData)) {
        groupData.forEach(subItem => {
            const slot = processRow(subItem, item);
            if (slot) slots.push(slot);
        });
        return;
    }

    // Case B: The group is a Single Group (Object)
    if (groupData && typeof groupData === 'object') {
        const slot = processRow(groupData, item);
        if (slot) slots.push(slot);
        return;
    }

    // Case C: Fields are directly on the root item (Fallback)
    const rootSlot = processRow(item, item);
    if (rootSlot) {
        slots.push(rootSlot);
        return;
    }
    
    // Case D: Try to find fields in ANY g_ keys (Generic Fallback)
    const keys = Object.keys(item);
    for (const key of keys) {
        if (key.startsWith('g_') && typeof item[key] === 'object' && item[key] !== null) {
             // If it's an array (repeating generic)
             if (Array.isArray(item[key])) {
                 item[key].forEach((subItem: any) => {
                     const slot = processRow(subItem, item);
                     if (slot) slots.push(slot);
                 });
             } else {
                 // Single generic
                 const slot = processRow(item[key], item);
                 if (slot) slots.push(slot);
             }
        }
    }
  });

  return slots;
};

// --- Helpers ---

// Parses Dates/Times from Origami (Unix Timestamp or String)
const parseTime = (val: any): number => {
  if (!val) return 0;
  // If string looks like a number
  if (!isNaN(Number(val))) {
    let num = Number(val);
    // Heuristic: If timestamp is small (seconds), convert to ms
    // Origami usually sends seconds for Unix timestamps
    if (num < 10000000000) {
        num = num * 1000;
    }
    return num;
  }
  // Try date string
  const d = new Date(val);
  return d.getTime();
};

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
