import { describe, it, expect } from 'vitest';
import {
  formatCountdown,
  getUSStatusColor,
  getTASEStatusColor,
  getUSMarketSession,
  getTASEMarketSession,
  TIMEZONE_US,
  TIMEZONE_ISRAEL,
} from '../marketSessionEngine';

// --------------- formatCountdown ---------------

describe('formatCountdown', () => {
  it('returns "Now" when target is in the past', () => {
    const now = new Date('2024-06-01T12:00:00Z');
    const past = new Date('2024-06-01T11:00:00Z');
    expect(formatCountdown(past, now)).toBe('Now');
  });

  it('returns seconds for < 1 minute', () => {
    const now = new Date('2024-06-01T12:00:00Z');
    const target = new Date('2024-06-01T12:00:45Z');
    expect(formatCountdown(target, now)).toBe('45s');
  });

  it('returns minutes and seconds for < 1 hour', () => {
    const now = new Date('2024-06-01T12:00:00Z');
    const target = new Date('2024-06-01T12:05:30Z');
    expect(formatCountdown(target, now)).toBe('5m 30s');
  });

  it('returns hours and minutes for < 24 hours', () => {
    const now = new Date('2024-06-01T12:00:00Z');
    const target = new Date('2024-06-01T15:30:00Z');
    expect(formatCountdown(target, now)).toBe('3h 30m');
  });

  it('returns days and hours for > 24 hours', () => {
    const now = new Date('2024-06-01T12:00:00Z');
    const target = new Date('2024-06-03T18:00:00Z');
    expect(formatCountdown(target, now)).toBe('2d 6h');
  });

  it('returns "Now" when target equals now', () => {
    const now = new Date('2024-06-01T12:00:00Z');
    expect(formatCountdown(now, now)).toBe('Now');
  });
});

// --------------- getUSStatusColor ---------------

describe('getUSStatusColor', () => {
  it('returns success for MARKET OPEN', () => {
    expect(getUSStatusColor('MARKET OPEN')).toBe('success');
  });

  it('returns warning for PRE-MARKET', () => {
    expect(getUSStatusColor('PRE-MARKET')).toBe('warning');
  });

  it('returns warning for AFTER-HOURS', () => {
    expect(getUSStatusColor('AFTER-HOURS')).toBe('warning');
  });

  it('returns muted for CLOSED', () => {
    expect(getUSStatusColor('CLOSED')).toBe('muted');
  });
});

// --------------- getTASEStatusColor ---------------

describe('getTASEStatusColor', () => {
  it('returns success for OPEN', () => {
    expect(getTASEStatusColor('OPEN')).toBe('success');
  });

  it('returns warning for PRE-OPEN', () => {
    expect(getTASEStatusColor('PRE-OPEN')).toBe('warning');
  });

  it('returns warning for AUCTION', () => {
    expect(getTASEStatusColor('AUCTION')).toBe('warning');
  });

  it('returns muted for CLOSED', () => {
    expect(getTASEStatusColor('CLOSED')).toBe('muted');
  });
});

// --------------- timezone constants ---------------

describe('timezone constants', () => {
  it('US timezone is America/New_York', () => {
    expect(TIMEZONE_US).toBe('America/New_York');
  });

  it('Israel timezone is Asia/Jerusalem', () => {
    expect(TIMEZONE_ISRAEL).toBe('Asia/Jerusalem');
  });
});

// --------------- getUSMarketSession ---------------

describe('getUSMarketSession', () => {
  it('returns a session info object', () => {
    const info = getUSMarketSession(new Date('2024-06-03T10:00:00-04:00')); // Monday 10am ET
    expect(info).toHaveProperty('status');
    expect(info).toHaveProperty('exchangeTime');
    expect(info).toHaveProperty('exchangeTimezone');
    expect(info.exchangeTimezone).toBeDefined();
  });

  it('returns CLOSED on weekends', () => {
    const saturday = new Date('2024-06-08T14:00:00-04:00');
    const info = getUSMarketSession(saturday);
    expect(info.status).toBe('CLOSED');
  });

  it('returns MARKET OPEN during regular hours on a weekday', () => {
    // Monday June 3, 2024 at 11:00 AM ET
    const weekdayOpen = new Date('2024-06-03T15:00:00Z'); // 11:00 ET
    const info = getUSMarketSession(weekdayOpen);
    expect(info.status).toBe('MARKET OPEN');
  });

  it('returns CLOSED on known US holidays', () => {
    // Christmas 2024
    const christmas = new Date('2024-12-25T14:00:00-05:00');
    const info = getUSMarketSession(christmas);
    expect(info.status).toBe('CLOSED');
    expect(info.isHoliday).toBe(true);
    expect(info.holidayName).toBe('Christmas');
  });
});

// --------------- getTASEMarketSession ---------------

describe('getTASEMarketSession', () => {
  it('returns a session info object', () => {
    const info = getTASEMarketSession(new Date('2024-06-03T10:00:00+03:00')); // Monday 10am IST
    expect(info).toHaveProperty('status');
    expect(info).toHaveProperty('exchangeTimezone');
    expect(info.exchangeTimezone).toBeDefined();
  });

  it('returns CLOSED on Saturday (Shabbat)', () => {
    const saturday = new Date('2024-06-08T10:00:00+03:00');
    const info = getTASEMarketSession(saturday);
    expect(info.status).toBe('CLOSED');
  });

  it('returns CLOSED on Friday (TASE does not trade on Friday)', () => {
    const friday = new Date('2024-06-07T10:00:00+03:00');
    const info = getTASEMarketSession(friday);
    expect(info.status).toBe('CLOSED');
  });
});
