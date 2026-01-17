/**
 * Market Session Engine
 * 
 * Timezone-aware session calculation for US (NYSE/Nasdaq) and TASE markets.
 * Handles DST automatically for both Israel (Asia/Jerusalem) and US (America/New_York).
 */

import { 
  format, 
  isWeekend, 
  getDay, 
  parse, 
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  isBefore,
  isAfter,
  differenceInMilliseconds,
} from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// ============= TYPES =============

export type USMarketSession = 'PRE-MARKET' | 'MARKET OPEN' | 'AFTER-HOURS' | 'CLOSED';
export type TASEMarketSession = 'PRE-OPEN' | 'OPEN' | 'AUCTION' | 'CLOSED';

export interface MarketSessionInfo {
  status: USMarketSession | TASEMarketSession;
  nextChange: Date | null;
  nextStatus: string | null;
  exchangeTime: string;
  exchangeTimezone: string;
  isHoliday: boolean;
  holidayName?: string;
}

// ============= TIMEZONE CONSTANTS =============

export const TIMEZONE_US = 'America/New_York';
export const TIMEZONE_ISRAEL = 'Asia/Jerusalem';

// ============= US MARKET HOLIDAYS 2024-2026 =============
// Updated annually - holidays when NYSE/Nasdaq are closed

const US_MARKET_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-01-01': "New Year's Day",
  '2024-01-15': 'Martin Luther King Jr. Day',
  '2024-02-19': "Presidents' Day",
  '2024-03-29': 'Good Friday',
  '2024-05-27': 'Memorial Day',
  '2024-06-19': 'Juneteenth',
  '2024-07-04': 'Independence Day',
  '2024-09-02': 'Labor Day',
  '2024-11-28': 'Thanksgiving',
  '2024-12-25': 'Christmas',
  // 2025
  '2025-01-01': "New Year's Day",
  '2025-01-20': 'Martin Luther King Jr. Day',
  '2025-02-17': "Presidents' Day",
  '2025-04-18': 'Good Friday',
  '2025-05-26': 'Memorial Day',
  '2025-06-19': 'Juneteenth',
  '2025-07-04': 'Independence Day',
  '2025-09-01': 'Labor Day',
  '2025-11-27': 'Thanksgiving',
  '2025-12-25': 'Christmas',
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'Martin Luther King Jr. Day',
  '2026-02-16': "Presidents' Day",
  '2026-04-03': 'Good Friday',
  '2026-05-25': 'Memorial Day',
  '2026-06-19': 'Juneteenth',
  '2026-07-03': 'Independence Day (observed)',
  '2026-09-07': 'Labor Day',
  '2026-11-26': 'Thanksgiving',
  '2026-12-25': 'Christmas',
};

// ============= TASE HOLIDAYS 2024-2026 =============
// Israeli market holidays - includes Jewish holidays

const TASE_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-03-24': 'Purim',
  '2024-04-22': 'Passover Eve',
  '2024-04-23': 'Passover',
  '2024-04-28': 'Passover 7th Day',
  '2024-04-29': 'Passover 8th Day',
  '2024-05-14': 'Independence Day',
  '2024-06-11': 'Shavuot Eve',
  '2024-06-12': 'Shavuot',
  '2024-10-02': 'Rosh Hashanah Eve',
  '2024-10-03': 'Rosh Hashanah',
  '2024-10-04': 'Rosh Hashanah 2nd Day',
  '2024-10-11': 'Yom Kippur Eve',
  '2024-10-12': 'Yom Kippur',
  '2024-10-16': 'Sukkot Eve',
  '2024-10-17': 'Sukkot',
  '2024-10-23': 'Simchat Torah Eve',
  '2024-10-24': 'Simchat Torah',
  // 2025
  '2025-03-13': 'Purim Eve',
  '2025-03-14': 'Purim',
  '2025-04-12': 'Passover Eve',
  '2025-04-13': 'Passover',
  '2025-04-18': 'Passover 7th Day',
  '2025-04-19': 'Passover 8th Day',
  '2025-05-01': 'Independence Day Eve',
  '2025-05-02': 'Independence Day',
  '2025-06-01': 'Shavuot Eve',
  '2025-06-02': 'Shavuot',
  '2025-09-22': 'Rosh Hashanah Eve',
  '2025-09-23': 'Rosh Hashanah',
  '2025-09-24': 'Rosh Hashanah 2nd Day',
  '2025-10-01': 'Yom Kippur Eve',
  '2025-10-02': 'Yom Kippur',
  '2025-10-06': 'Sukkot Eve',
  '2025-10-07': 'Sukkot',
  '2025-10-13': 'Simchat Torah Eve',
  '2025-10-14': 'Simchat Torah',
  // 2026
  '2026-03-04': 'Purim Eve',
  '2026-03-05': 'Purim',
  '2026-04-01': 'Passover Eve',
  '2026-04-02': 'Passover',
  '2026-04-07': 'Passover 7th Day',
  '2026-04-08': 'Passover 8th Day',
  '2026-04-22': 'Independence Day',
  '2026-05-21': 'Shavuot Eve',
  '2026-05-22': 'Shavuot',
  '2026-09-11': 'Rosh Hashanah Eve',
  '2026-09-12': 'Rosh Hashanah',
  '2026-09-13': 'Rosh Hashanah 2nd Day',
  '2026-09-20': 'Yom Kippur Eve',
  '2026-09-21': 'Yom Kippur',
  '2026-09-25': 'Sukkot Eve',
  '2026-09-26': 'Sukkot',
  '2026-10-02': 'Simchat Torah Eve',
  '2026-10-03': 'Simchat Torah',
};

// ============= SESSION TIME DEFINITIONS =============

// US Market sessions (in ET - America/New_York)
const US_SESSIONS = {
  PRE_MARKET: { start: { hour: 4, minute: 0 }, end: { hour: 9, minute: 30 } },
  REGULAR: { start: { hour: 9, minute: 30 }, end: { hour: 16, minute: 0 } },
  AFTER_HOURS: { start: { hour: 16, minute: 0 }, end: { hour: 20, minute: 0 } },
};

// TASE sessions (in Israel time)
// Sunday-Thursday: 09:00-17:25 (continuous trading)
// Pre-open: 08:45-09:00, Closing auction: 17:25-17:35
const TASE_SESSIONS = {
  PRE_OPEN: { start: { hour: 8, minute: 45 }, end: { hour: 9, minute: 0 } },
  REGULAR: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 25 } },
  AUCTION: { start: { hour: 17, minute: 25 }, end: { hour: 17, minute: 35 } },
};

// ============= HELPER FUNCTIONS =============

function getDateKey(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

function isUSHoliday(date: Date): { isHoliday: boolean; holidayName?: string } {
  const dateKey = getDateKey(date, TIMEZONE_US);
  const holidayName = US_MARKET_HOLIDAYS[dateKey];
  return { isHoliday: !!holidayName, holidayName };
}

function isTASEHoliday(date: Date): { isHoliday: boolean; holidayName?: string } {
  const dateKey = getDateKey(date, TIMEZONE_ISRAEL);
  const holidayName = TASE_HOLIDAYS[dateKey];
  return { isHoliday: !!holidayName, holidayName };
}

function isUSWeekend(date: Date): boolean {
  const zonedDate = toZonedTime(date, TIMEZONE_US);
  const day = getDay(zonedDate);
  return day === 0 || day === 6; // Sunday or Saturday
}

function isTASEWeekend(date: Date): boolean {
  const zonedDate = toZonedTime(date, TIMEZONE_ISRAEL);
  const day = getDay(zonedDate);
  return day === 5 || day === 6; // Friday or Saturday
}

function createTimeInTimezone(date: Date, timezone: string, hour: number, minute: number, second: number = 0): Date {
  const zonedDate = toZonedTime(date, timezone);
  const adjusted = setSeconds(setMinutes(setHours(zonedDate, hour), minute), second);
  // Convert back to UTC for comparison
  const dateStr = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  return new Date(`${dateStr}T${timeStr}`);
}

function getTimeInMinutes(date: Date, timezone: string): number {
  const zonedDate = toZonedTime(date, timezone);
  return zonedDate.getHours() * 60 + zonedDate.getMinutes();
}

// ============= US MARKET SESSION CALCULATION =============

export function getUSMarketSession(now: Date = new Date()): MarketSessionInfo {
  const exchangeTime = formatInTimeZone(now, TIMEZONE_US, 'HH:mm:ss');
  const { isHoliday, holidayName } = isUSHoliday(now);
  
  // Check for weekend or holiday
  if (isUSWeekend(now) || isHoliday) {
    const nextTradingDay = findNextUSTradingDay(now);
    const nextOpen = createTimeInTimezone(nextTradingDay, TIMEZONE_US, 4, 0);
    
    return {
      status: 'CLOSED',
      nextChange: nextOpen,
      nextStatus: 'PRE-MARKET',
      exchangeTime,
      exchangeTimezone: 'ET',
      isHoliday,
      holidayName: isHoliday ? holidayName : (isUSWeekend(now) ? 'Weekend' : undefined),
    };
  }
  
  const currentMinutes = getTimeInMinutes(now, TIMEZONE_US);
  
  // Pre-market: 04:00 - 09:30 ET
  const preMarketStart = US_SESSIONS.PRE_MARKET.start.hour * 60 + US_SESSIONS.PRE_MARKET.start.minute;
  const preMarketEnd = US_SESSIONS.PRE_MARKET.end.hour * 60 + US_SESSIONS.PRE_MARKET.end.minute;
  
  // Regular: 09:30 - 16:00 ET
  const regularStart = US_SESSIONS.REGULAR.start.hour * 60 + US_SESSIONS.REGULAR.start.minute;
  const regularEnd = US_SESSIONS.REGULAR.end.hour * 60 + US_SESSIONS.REGULAR.end.minute;
  
  // After-hours: 16:00 - 20:00 ET
  const afterHoursStart = US_SESSIONS.AFTER_HOURS.start.hour * 60 + US_SESSIONS.AFTER_HOURS.start.minute;
  const afterHoursEnd = US_SESSIONS.AFTER_HOURS.end.hour * 60 + US_SESSIONS.AFTER_HOURS.end.minute;
  
  if (currentMinutes < preMarketStart) {
    // Before pre-market
    const nextChange = new Date(now);
    const zonedNow = toZonedTime(now, TIMEZONE_US);
    nextChange.setTime(now.getTime() + (preMarketStart - currentMinutes) * 60 * 1000);
    
    return {
      status: 'CLOSED',
      nextChange,
      nextStatus: 'PRE-MARKET',
      exchangeTime,
      exchangeTimezone: 'ET',
      isHoliday: false,
    };
  }
  
  if (currentMinutes >= preMarketStart && currentMinutes < preMarketEnd) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (regularStart - currentMinutes) * 60 * 1000);
    
    return {
      status: 'PRE-MARKET',
      nextChange,
      nextStatus: 'MARKET OPEN',
      exchangeTime,
      exchangeTimezone: 'ET',
      isHoliday: false,
    };
  }
  
  if (currentMinutes >= regularStart && currentMinutes < regularEnd) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (afterHoursStart - currentMinutes) * 60 * 1000);
    
    return {
      status: 'MARKET OPEN',
      nextChange,
      nextStatus: 'AFTER-HOURS',
      exchangeTime,
      exchangeTimezone: 'ET',
      isHoliday: false,
    };
  }
  
  if (currentMinutes >= afterHoursStart && currentMinutes < afterHoursEnd) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (afterHoursEnd - currentMinutes) * 60 * 1000);
    
    return {
      status: 'AFTER-HOURS',
      nextChange,
      nextStatus: 'CLOSED',
      exchangeTime,
      exchangeTimezone: 'ET',
      isHoliday: false,
    };
  }
  
  // After after-hours
  const nextTradingDay = findNextUSTradingDay(addDays(now, 1));
  const nextOpen = createTimeInTimezone(nextTradingDay, TIMEZONE_US, 4, 0);
  
  return {
    status: 'CLOSED',
    nextChange: nextOpen,
    nextStatus: 'PRE-MARKET',
    exchangeTime,
    exchangeTimezone: 'ET',
    isHoliday: false,
  };
}

function findNextUSTradingDay(startDate: Date): Date {
  let candidate = startDate;
  for (let i = 0; i < 10; i++) {
    if (!isUSWeekend(candidate) && !isUSHoliday(candidate).isHoliday) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }
  return candidate;
}

// ============= TASE MARKET SESSION CALCULATION =============

export function getTASEMarketSession(now: Date = new Date()): MarketSessionInfo {
  const exchangeTime = formatInTimeZone(now, TIMEZONE_ISRAEL, 'HH:mm:ss');
  const { isHoliday, holidayName } = isTASEHoliday(now);
  
  // Check for weekend (Friday/Saturday) or holiday
  if (isTASEWeekend(now) || isHoliday) {
    const nextTradingDay = findNextTASETradingDay(now);
    const nextOpen = createTimeInTimezone(nextTradingDay, TIMEZONE_ISRAEL, 8, 45);
    
    return {
      status: 'CLOSED',
      nextChange: nextOpen,
      nextStatus: 'PRE-OPEN',
      exchangeTime,
      exchangeTimezone: 'IST',
      isHoliday,
      holidayName: isHoliday ? holidayName : (isTASEWeekend(now) ? 'Weekend' : undefined),
    };
  }
  
  const currentMinutes = getTimeInMinutes(now, TIMEZONE_ISRAEL);
  
  // Pre-open: 08:45 - 09:00
  const preOpenStart = TASE_SESSIONS.PRE_OPEN.start.hour * 60 + TASE_SESSIONS.PRE_OPEN.start.minute;
  const preOpenEnd = TASE_SESSIONS.PRE_OPEN.end.hour * 60 + TASE_SESSIONS.PRE_OPEN.end.minute;
  
  // Regular: 09:00 - 17:25
  const regularStart = TASE_SESSIONS.REGULAR.start.hour * 60 + TASE_SESSIONS.REGULAR.start.minute;
  const regularEnd = TASE_SESSIONS.REGULAR.end.hour * 60 + TASE_SESSIONS.REGULAR.end.minute;
  
  // Auction: 17:25 - 17:35
  const auctionStart = TASE_SESSIONS.AUCTION.start.hour * 60 + TASE_SESSIONS.AUCTION.start.minute;
  const auctionEnd = TASE_SESSIONS.AUCTION.end.hour * 60 + TASE_SESSIONS.AUCTION.end.minute;
  
  if (currentMinutes < preOpenStart) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (preOpenStart - currentMinutes) * 60 * 1000);
    
    return {
      status: 'CLOSED',
      nextChange,
      nextStatus: 'PRE-OPEN',
      exchangeTime,
      exchangeTimezone: 'IST',
      isHoliday: false,
    };
  }
  
  if (currentMinutes >= preOpenStart && currentMinutes < preOpenEnd) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (regularStart - currentMinutes) * 60 * 1000);
    
    return {
      status: 'PRE-OPEN',
      nextChange,
      nextStatus: 'OPEN',
      exchangeTime,
      exchangeTimezone: 'IST',
      isHoliday: false,
    };
  }
  
  if (currentMinutes >= regularStart && currentMinutes < regularEnd) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (auctionStart - currentMinutes) * 60 * 1000);
    
    return {
      status: 'OPEN',
      nextChange,
      nextStatus: 'AUCTION',
      exchangeTime,
      exchangeTimezone: 'IST',
      isHoliday: false,
    };
  }
  
  if (currentMinutes >= auctionStart && currentMinutes < auctionEnd) {
    const nextChange = new Date(now);
    nextChange.setTime(now.getTime() + (auctionEnd - currentMinutes) * 60 * 1000);
    
    return {
      status: 'AUCTION',
      nextChange,
      nextStatus: 'CLOSED',
      exchangeTime,
      exchangeTimezone: 'IST',
      isHoliday: false,
    };
  }
  
  // After auction
  const nextTradingDay = findNextTASETradingDay(addDays(now, 1));
  const nextOpen = createTimeInTimezone(nextTradingDay, TIMEZONE_ISRAEL, 8, 45);
  
  return {
    status: 'CLOSED',
    nextChange: nextOpen,
    nextStatus: 'PRE-OPEN',
    exchangeTime,
    exchangeTimezone: 'IST',
    isHoliday: false,
  };
}

function findNextTASETradingDay(startDate: Date): Date {
  let candidate = startDate;
  for (let i = 0; i < 10; i++) {
    if (!isTASEWeekend(candidate) && !isTASEHoliday(candidate).isHoliday) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }
  return candidate;
}

// ============= COUNTDOWN FORMATTER =============

export function formatCountdown(targetDate: Date, now: Date = new Date()): string {
  const diff = differenceInMilliseconds(targetDate, now);
  if (diff <= 0) return 'Now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
}

// ============= STATUS COLOR MAPPING =============

export function getUSStatusColor(status: USMarketSession): 'success' | 'warning' | 'muted' {
  switch (status) {
    case 'MARKET OPEN':
      return 'success';
    case 'PRE-MARKET':
    case 'AFTER-HOURS':
      return 'warning';
    case 'CLOSED':
      return 'muted';
  }
}

export function getTASEStatusColor(status: TASEMarketSession): 'success' | 'warning' | 'muted' {
  switch (status) {
    case 'OPEN':
      return 'success';
    case 'PRE-OPEN':
    case 'AUCTION':
      return 'warning';
    case 'CLOSED':
      return 'muted';
  }
}
