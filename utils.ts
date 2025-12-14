import { OrigamiSlot, SlotTemplate } from './types';

// Constants for Origami Fields
export const ORIGAMI_CONFIG = {
  dataName: 'e_90',    // The main entity
  groupName: 'g_256',  // The field group
  fields: {
    start: 'fld_1544', // Start time
    end: 'fld_1545',   // End time
  }
};

/**
 * Extracts JUST the time (hour/minute) from an Origami field.
 * Handles: Unix timestamps, ISO strings, "HH:mm" strings.
 */
const extractTime = (val: any): { hour: number; minute: number } | null => {
  if (!val) return null;

  // Case 1: "HH:mm" string
  if (typeof val === 'string' && /^\d{1,2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(':').map(Number);
    return { hour: h, minute: m };
  }

  // Case 2: Timestamp or Date object
  let dateObj: Date | null = null;
  if (!isNaN(Number(val))) {
    // If it's a small number (seconds), convert to ms, otherwise use as ms
    // Heuristic: Unix timestamp in seconds is usually < 10000000000 (valid until year 2286)
    let ms = Number(val);
    if (ms < 10000000000) ms *= 1000;
    dateObj = new Date(ms);
  } else {
    // Try parsing string (ISO etc)
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (dateObj) {
    // Adjust for timezone offset if necessary, but usually getHours() matches local time
    // If Origami sends UTC timestamps for "08:00", we might need to be careful.
    // For now, assuming standard Date object behavior works for the user's locale.
    return { hour: dateObj.getHours(), minute: dateObj.getMinutes() };
  }

  return null;
};

/**
 * Parses raw Origami data into "Slot Templates".
 * These are time ranges (e.g. 08:00-09:00) without a specific date.
 */
export const parseOrigamiTemplates = (data: any): SlotTemplate[] => {
  let list = data;

  // Handle common Origami response wrappers
  if (!Array.isArray(data) && data && Array.isArray(data.instanceList)) {
      list = data.instanceList;
  }

  if (!Array.isArray(list)) return [];

  const templates: SlotTemplate[] = [];

  list.forEach((item) => {
    // Look for the group defined in config
    const groupData = item[ORIGAMI_CONFIG.groupName];

    // Helper to process a single data object (row)
    const processRow = (row: any, parentItem: any): SlotTemplate | null => {
        const rawStart = row[ORIGAMI_CONFIG.fields.start];
        const rawEnd = row[ORIGAMI_CONFIG.fields.end];

        const startTime = extractTime(rawStart);
        const endTime = extractTime(rawEnd);

        if (!startTime || !endTime) return null;

        return {
          id: row._id || row.id || Math.random().toString(36).substr(2, 9),
          title: row.title || 'פגישה', 
          start: startTime,
          end: endTime
        };
    };

    // Case A: Group is Array (Repeating Group)
    if (Array.isArray(groupData)) {
        groupData.forEach(subItem => {
            const tmpl = processRow(subItem, item);
            if (tmpl) templates.push(tmpl);
        });
        return;
    }

    // Case B: Group is Object (Single Group)
    if (groupData && typeof groupData === 'object') {
        const tmpl = processRow(groupData, item);
        if (tmpl) templates.push(tmpl);
        return;
    }

    // Case C: Fallback to root or generic search
    // (If the structure is flatter than expected)
    const rootTmpl = processRow(item, item);
    if (rootTmpl) {
        templates.push(rootTmpl);
    }
  });

  return templates;
};

/**
 * Generates concrete slots for a specific date range based on templates.
 * E.g., takes "08:00-09:00" and creates a slot for Sunday, Monday, Tuesday...
 */
export const generateSlotsForRange = (
  templates: SlotTemplate[], 
  startDate: Date, 
  endDate: Date
): OrigamiSlot[] => {
  const slots: OrigamiSlot[] = [];
  const loopDate = new Date(startDate);
  
  // Normalize loop date to start of day to avoid partial day skips
  loopDate.setHours(0,0,0,0);
  
  const endLimit = new Date(endDate);
  endLimit.setHours(23,59,59,999);

  while (loopDate <= endLimit) {
    templates.forEach(tmpl => {
      const slotStart = new Date(loopDate);
      slotStart.setHours(tmpl.start.hour, tmpl.start.minute, 0, 0);

      const slotEnd = new Date(loopDate);
      slotEnd.setHours(tmpl.end.hour, tmpl.end.minute, 0, 0);

      // Handle overnight slots (end time < start time implies next day)
      if (slotEnd < slotStart) {
        slotEnd.setDate(slotEnd.getDate() + 1);
      }

      slots.push({
        id: `${tmpl.id}-${loopDate.getTime()}`, // Unique ID per day
        startTime: slotStart.getTime(),
        endTime: slotEnd.getTime(),
        title: tmpl.title,
        originalData: tmpl
      });
    });

    // Next day
    loopDate.setDate(loopDate.getDate() + 1);
  }

  return slots;
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