import { CalendarEvent, RecurrenceRule } from '@/types/calendar';
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  startOfDay, 
  endOfDay,
  isAfter,
  isBefore,
  parseISO,
  format,
  getDay,
  setDate,
} from 'date-fns';

const STORAGE_KEY = 'sufox_calendar_events';

// Storage service abstraction - easy to swap with DB later
class CalendarStorageService {
  private events: CalendarEvent[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.events = JSON.parse(stored);
      } catch {
        this.events = [];
      }
    }
    this.initialized = true;
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
  }

  async getEvents(): Promise<CalendarEvent[]> {
    await this.init();
    return [...this.events];
  }

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    await this.init();
    return this.events.find(e => e.id === id);
  }

  async createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    await this.init();
    
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    this.events.push(newEvent);
    this.save();
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    await this.init();
    
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    
    this.events[index] = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.save();
    return this.events[index];
  }

  async deleteEvent(id: string): Promise<boolean> {
    await this.init();
    
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    this.events.splice(index, 1);
    this.save();
    return true;
  }

  async deleteEventSeries(seriesId: string): Promise<number> {
    await this.init();
    
    const before = this.events.length;
    this.events = this.events.filter(e => e.seriesId !== seriesId && e.id !== seriesId);
    const deleted = before - this.events.length;
    
    this.save();
    return deleted;
  }

  // Clear all and replace with seed data
  async seedEvents(events: CalendarEvent[]): Promise<void> {
    this.events = events;
    this.save();
    this.initialized = true;
  }

  async clearAll(): Promise<void> {
    this.events = [];
    this.save();
  }
}

export const calendarStorage = new CalendarStorageService();

// Utility to expand recurring events within a date range
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences = 500
): CalendarEvent[] {
  const result: CalendarEvent[] = [];
  
  for (const event of events) {
    if (!event.recurrenceRule || event.recurrenceRule.frequency === 'none') {
      // Non-recurring event
      const eventStart = parseISO(event.startDateTime);
      const eventEnd = parseISO(event.endDateTime);
      
      if (
        (isAfter(eventEnd, rangeStart) || eventEnd.getTime() === rangeStart.getTime()) &&
        (isBefore(eventStart, rangeEnd) || eventStart.getTime() === rangeEnd.getTime())
      ) {
        result.push(event);
      }
    } else {
      // Expand recurring event
      const occurrences = generateOccurrences(event, rangeStart, rangeEnd, maxOccurrences);
      result.push(...occurrences);
    }
  }
  
  return result;
}

function generateOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number
): CalendarEvent[] {
  const rule = event.recurrenceRule!;
  const occurrences: CalendarEvent[] = [];
  
  const eventStart = parseISO(event.startDateTime);
  const eventEnd = parseISO(event.endDateTime);
  const duration = eventEnd.getTime() - eventStart.getTime();
  
  const recurrenceEndDate = rule.endDate ? parseISO(rule.endDate) : addYears(rangeEnd, 1);
  
  let currentDate = new Date(eventStart);
  let count = 0;
  
  while (
    isBefore(currentDate, rangeEnd) && 
    isBefore(currentDate, recurrenceEndDate) &&
    count < maxOccurrences &&
    (!rule.count || count < rule.count)
  ) {
    const occurrenceEnd = new Date(currentDate.getTime() + duration);
    
    // Check if this occurrence falls within range
    if (
      (isAfter(occurrenceEnd, rangeStart) || occurrenceEnd.getTime() === rangeStart.getTime()) &&
      (isBefore(currentDate, rangeEnd) || currentDate.getTime() === rangeEnd.getTime())
    ) {
      // For weekly recurrence with byDay, check if current day matches
      if (rule.frequency === 'weekly' && rule.byDay && rule.byDay.length > 0) {
        if (rule.byDay.includes(getDay(currentDate))) {
          occurrences.push(createOccurrence(event, currentDate, occurrenceEnd, count));
        }
      } else {
        occurrences.push(createOccurrence(event, currentDate, occurrenceEnd, count));
      }
    }
    
    // Move to next occurrence
    currentDate = getNextOccurrence(currentDate, rule);
    count++;
  }
  
  return occurrences;
}

function createOccurrence(
  event: CalendarEvent,
  start: Date,
  end: Date,
  index: number
): CalendarEvent {
  return {
    ...event,
    id: `${event.id}_${index}`,
    seriesId: event.id,
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
  };
}

function getNextOccurrence(current: Date, rule: RecurrenceRule): Date {
  const interval = rule.interval || 1;
  
  switch (rule.frequency) {
    case 'daily':
      return addDays(current, interval);
    case 'weekly':
      if (rule.byDay && rule.byDay.length > 0) {
        // Move to next day, cycling through week
        return addDays(current, 1);
      }
      return addWeeks(current, interval);
    case 'monthly':
      if (rule.byMonthDay) {
        const next = addMonths(current, interval);
        return setDate(next, rule.byMonthDay);
      }
      return addMonths(current, interval);
    case 'yearly':
      return addYears(current, interval);
    default:
      return addDays(current, 1);
  }
}
