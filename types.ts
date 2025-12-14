export interface OrigamiSlot {
  id: string;
  startTime: number; // Unix timestamp
  endTime: number;   // Unix timestamp
  title?: string;
  originalData?: any;
}

export type ViewType = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

// Helper interface for Origami API response structure
export interface OrigamiResponseItem {
  _id: string;
  [key: string]: any;
}
