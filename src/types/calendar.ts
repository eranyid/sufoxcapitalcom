// Calendar Event Types for SUFOX Capital

export type EventCategory = 
  | 'operations' 
  | 'research' 
  | 'risk' 
  | 'trading' 
  | 'admin'
  | 'compliance'
  | 'meetings';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type LinkedModule = 'fx_rates' | 'transactions' | 'risk' | 'reports' | 'valuations' | 'none';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every 2 weeks
  byDay?: number[]; // 0 = Sunday, 1 = Monday, etc.
  byMonthDay?: number; // day of month for monthly recurrence
  endDate?: string; // ISO date string
  count?: number; // number of occurrences
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  allDay: boolean;
  location?: string;
  notes?: string;
  category: EventCategory;
  recurrenceRule?: RecurrenceRule;
  timezone: string;
  isCompleted: boolean;
  linkedModule: LinkedModule;
  seriesId?: string; // for recurring events, links to parent
  isRecurrenceException?: boolean; // if this instance was edited
  createdAt: string;
  updatedAt: string;
}

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// Category colors matching SUFOX design
export const CATEGORY_COLORS: Record<EventCategory, { bg: string; border: string; text: string }> = {
  operations: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  research: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  risk: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  trading: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  admin: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  compliance: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  meetings: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
};

export const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'operations', label: 'Operations' },
  { value: 'research', label: 'Research' },
  { value: 'risk', label: 'Risk' },
  { value: 'trading', label: 'Trading' },
  { value: 'admin', label: 'Admin' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'meetings', label: 'Meetings' },
];

export const LINKED_MODULE_OPTIONS: { value: LinkedModule; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fx_rates', label: 'FX Rates' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'risk', label: 'Risk' },
  { value: 'reports', label: 'Reports' },
  { value: 'valuations', label: 'Valuations' },
];

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];
