import { OrigamiSlot, SlotTemplate } from './types';

// Constants for Origami Fields
export const ORIGAMI_CONFIG = {
  dataName: 'e_90',    // The main entity
  // groupName: 'g_256', // Removed hard dependency on specific group to be safer
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
  if (val === undefined || val === null || val === '') return null;

  // Case 1: "HH:mm" string
  if (typeof val === 'string' && /^\d{1,2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(':').map(Number);
    return { hour: h, minute: m };
  }

  // Case 2: Timestamp or Date object
  let dateObj: Date | null = null;
  
  // Check if it's a pure number or a numeric string
  if (!isNaN(Number(val))) {
    let ms = Number(val);
    // Heuristic: Unix timestamp in seconds is usually < 10000000000 (valid until year 2286)
    if (ms < 10000000000) ms *= 1000;
    dateObj = new Date(ms);
  } else {
    // Try parsing string (ISO etc)
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    // We only care about the hours/minutes for the template
    return { hour: dateObj.getHours(), minute: dateObj.getMinutes() };
  }

  return null;
};

/**
 * Parses raw Origami data into "Slot Templates".
 * Searches for start/end fields at the root of the item or within groups.
 */
export const parseOrigamiTemplates = (data: any): SlotTemplate[] => {
  let list = data;

  // Handle common Origami response wrappers
  if (!Array.isArray(data) && data) {
      if (Array.isArray(data.instanceList)) {
          list = data.instanceList;
      } else if (Array.isArray(data.data)) {
          list = data.data;
      }
  }

  if (!Array.isArray(list)) {
      console.warn("Parsed data is not an array:", list);
      return [];
  }

  const templates: SlotTemplate[] = [];

  list.forEach((item, index) => {
    // Helper to extract fields from a specific object
    const extractFromObject = (obj: any, sourceName: string): SlotTemplate | null => {
        const rawStart = obj[ORIGAMI_CONFIG.fields.start];
        const rawEnd = obj[ORIGAMI_CONFIG.fields.end];

        if (!rawStart && !rawEnd) return null;

        const startTime = extractTime(rawStart);
        const endTime = extractTime(rawEnd);

        if (!startTime || !endTime) {
            console.warn(`Found fields in ${sourceName} but failed to parse time. Start: ${rawStart}, End: ${rawEnd}`);
            return null;
        }

        return {
          id: obj._id || obj.id || `${index}-${sourceName}-${Math.random()}`,
          title: obj.title || obj.fld_title || 'סלוט פנוי', // Can be customized if title field provided
          start: startTime,
          end: endTime
        };
    };

    // 1. Try finding fields at the ROOT of the item
    const rootTemplate = extractFromObject(item, 'root');
    if (rootTemplate) {
        templates.push(rootTemplate);
    }

    // 2. Iterate over all keys to find potential groups (keys starting with 'g_')
    //    Only do this if we suspect data is hidden in groups
    Object.keys(item).forEach(key => {
        if (key.startsWith('g_')) {
            const groupVal = item[key];
            
            // If group is an Array (Repeating Group)
            if (Array.isArray(groupVal)) {
                groupVal.forEach((subItem, subIdx) => {
                    const subTemplate = extractFromObject(subItem, `${key}[${subIdx}]`);
                    if (subTemplate) templates.push(subTemplate);
                });
            } 
            // If group is an Object
            else if (groupVal && typeof groupVal === 'object') {
                const subTemplate = extractFromObject(groupVal, key);
                if (subTemplate) templates.push(subTemplate);
            }
        }
    });
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
  
  // Normalize loop date to start of day
  loopDate.setHours(0,0,0,0);
  
  const endLimit = new Date(endDate);
  endLimit.setHours(23,59,59,999);

  while (loopDate <= endLimit) {
    templates.forEach(tmpl => {
      const slotStart = new Date(loopDate);
      slotStart.setHours(tmpl.start.hour, tmpl.start.minute, 0, 0);

      const slotEnd = new Date(loopDate);
      slotEnd.setHours(tmpl.end.hour, tmpl.end.minute, 0, 0);

      // Handle overnight slots
      if (slotEnd < slotStart) {
        slotEnd.setDate(slotEnd.getDate() + 1);
      }

      slots.push({
        id: `${tmpl.id}-${loopDate.getTime()}`, 
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

// --- Date Helpers --- (unchanged but required for file integrity)

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
  const day = d.getDay(); 
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