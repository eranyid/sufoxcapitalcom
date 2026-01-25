import { CalendarEvent } from '@/types/calendar';
import { addDays, addWeeks, addMonths, setHours, setMinutes, format } from 'date-fns';

// Generate realistic seed data for SUFOX Capital calendar
export function generateSeedEvents(): CalendarEvent[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const events: CalendarEvent[] = [];
  const createId = () => crypto.randomUUID();
  const createTimestamp = () => now.toISOString();
  
  // 1. Recurring: Update Equity & FX Rates (Mon-Fri 18:00-18:15)
  events.push({
    id: createId(),
    title: 'Update Equity & FX Rates',
    startDateTime: setMinutes(setHours(today, 18), 0).toISOString(),
    endDateTime: setMinutes(setHours(today, 18), 15).toISOString(),
    allDay: false,
    category: 'operations',
    notes: 'Pull daily closes, validate splits/dividends, refresh FX table, run validation checks.',
    recurrenceRule: {
      frequency: 'weekly',
      interval: 1,
      byDay: [1, 2, 3, 4, 5], // Monday to Friday
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'fx_rates',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 2. Monthly: Investment Committee
  events.push({
    id: createId(),
    title: 'Investment Committee Meeting',
    startDateTime: setMinutes(setHours(addDays(today, 5), 10), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 5), 12), 0).toISOString(),
    allDay: false,
    category: 'meetings',
    location: 'Conference Room A',
    notes: 'Review portfolio performance, discuss new opportunities, risk assessment.',
    recurrenceRule: {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 15,
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 3. Quarterly: Portfolio Rebalance
  events.push({
    id: createId(),
    title: 'Quarterly Portfolio Rebalance',
    startDateTime: setMinutes(setHours(addDays(today, 12), 9), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 12), 17), 0).toISOString(),
    allDay: false,
    category: 'trading',
    notes: 'Execute quarterly rebalancing trades. Review drift analysis and optimize allocations.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'transactions',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 4. Monthly Report Deadline
  events.push({
    id: createId(),
    title: 'Monthly Performance Report',
    startDateTime: setMinutes(setHours(addDays(today, 2), 14), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 2), 16), 0).toISOString(),
    allDay: false,
    category: 'operations',
    notes: 'Finalize and distribute monthly performance report to LPs.',
    recurrenceRule: {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 5,
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'reports',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 5. LP Meeting
  events.push({
    id: createId(),
    title: 'LP Quarterly Review',
    startDateTime: setMinutes(setHours(addDays(today, 20), 15), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 20), 17), 0).toISOString(),
    allDay: false,
    category: 'meetings',
    location: 'Video Conference',
    notes: 'Quarterly review with limited partners. Prepare presentation deck.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'reports',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 6. CPI Release
  events.push({
    id: createId(),
    title: 'Israel CPI Release',
    startDateTime: setMinutes(setHours(addDays(today, 8), 8), 30).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 8), 9), 0).toISOString(),
    allDay: false,
    category: 'research',
    notes: 'CBS publishes monthly CPI data. Monitor for inflation-linked positions impact.',
    recurrenceRule: {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 15,
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 7. Risk Review
  events.push({
    id: createId(),
    title: 'Weekly Risk Review',
    startDateTime: setMinutes(setHours(addDays(today, 1), 11), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 1), 12), 0).toISOString(),
    allDay: false,
    category: 'risk',
    notes: 'Review VaR, concentration risks, and stress test results.',
    recurrenceRule: {
      frequency: 'weekly',
      interval: 1,
      byDay: [1], // Monday
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'risk',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 8. Compliance Check
  events.push({
    id: createId(),
    title: 'Monthly Compliance Review',
    startDateTime: setMinutes(setHours(addDays(today, 25), 10), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 25), 11), 30).toISOString(),
    allDay: false,
    category: 'compliance',
    notes: 'Review regulatory compliance, check policy adherence, update documentation.',
    recurrenceRule: {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 28,
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 9. Fed Meeting
  events.push({
    id: createId(),
    title: 'FOMC Meeting',
    startDateTime: setMinutes(setHours(addWeeks(today, 3), 20), 0).toISOString(),
    endDateTime: setMinutes(setHours(addWeeks(today, 3), 21), 0).toISOString(),
    allDay: false,
    category: 'research',
    notes: 'Federal Reserve interest rate decision. Monitor USD/ILS impact.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'fx_rates',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 10. New Position Research
  events.push({
    id: createId(),
    title: 'NVIDIA Deep Dive',
    startDateTime: setMinutes(setHours(addDays(today, 3), 14), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 3), 17), 0).toISOString(),
    allDay: false,
    category: 'research',
    notes: 'Complete thesis review and valuation model for potential position.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 11. Trade Execution
  events.push({
    id: createId(),
    title: 'Execute AAPL Buy Order',
    startDateTime: setMinutes(setHours(addDays(today, 1), 16), 30).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 1), 17), 0).toISOString(),
    allDay: false,
    category: 'trading',
    notes: 'Execute approved buy order. Target: 100 shares at market.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'transactions',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 12. Dividend Calendar Check
  events.push({
    id: createId(),
    title: 'Dividend Calendar Review',
    startDateTime: setMinutes(setHours(today, 9), 0).toISOString(),
    endDateTime: setMinutes(setHours(today, 9), 30).toISOString(),
    allDay: false,
    category: 'operations',
    notes: 'Check upcoming ex-dividend dates for portfolio holdings.',
    recurrenceRule: {
      frequency: 'weekly',
      interval: 1,
      byDay: [1], // Monday
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 13. Admin Task
  events.push({
    id: createId(),
    title: 'Update Investment Policy Document',
    startDateTime: setMinutes(setHours(addDays(today, 7), 10), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 7), 12), 0).toISOString(),
    allDay: false,
    category: 'admin',
    notes: 'Annual review and update of IPS. Document any policy changes.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 14. Earnings Call
  events.push({
    id: createId(),
    title: 'Microsoft Earnings Call',
    startDateTime: setMinutes(setHours(addDays(today, 14), 23), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 15), 0), 0).toISOString(),
    allDay: false,
    category: 'research',
    notes: 'Q4 earnings release. Listen to call and update thesis.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 15. Valuation Update
  events.push({
    id: createId(),
    title: 'Monthly Valuations Update',
    startDateTime: setMinutes(setHours(addMonths(today, 0), 15), 0).toISOString(),
    endDateTime: setMinutes(setHours(addMonths(today, 0), 17), 0).toISOString(),
    allDay: false,
    category: 'operations',
    notes: 'Update all position valuations for month-end NAV.',
    recurrenceRule: {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 1,
    },
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'valuations',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 16. All-day Event
  events.push({
    id: createId(),
    title: 'US Market Holiday',
    startDateTime: addWeeks(today, 4).toISOString(),
    endDateTime: addWeeks(today, 4).toISOString(),
    allDay: true,
    category: 'admin',
    notes: 'US markets closed. No trading.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 17. Bank of Israel
  events.push({
    id: createId(),
    title: 'Bank of Israel Rate Decision',
    startDateTime: setMinutes(setHours(addDays(today, 18), 16), 0).toISOString(),
    endDateTime: setMinutes(setHours(addDays(today, 18), 16), 30).toISOString(),
    allDay: false,
    category: 'research',
    notes: 'Monetary policy decision. Watch for ILS impact.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'fx_rates',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  // 18. Audit Prep
  events.push({
    id: createId(),
    title: 'Annual Audit Preparation',
    startDateTime: setMinutes(setHours(addMonths(today, 1), 9), 0).toISOString(),
    endDateTime: setMinutes(setHours(addMonths(today, 1), 17), 0).toISOString(),
    allDay: false,
    category: 'compliance',
    notes: 'Prepare documentation for annual external audit.',
    timezone: 'Asia/Jerusalem',
    isCompleted: false,
    linkedModule: 'none',
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  });

  return events;
}
