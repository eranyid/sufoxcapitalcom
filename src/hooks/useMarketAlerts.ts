/**
 * useMarketAlerts - Hook for market session change notifications
 * 
 * Features:
 * - Monitors US and TASE market session changes
 * - Plays sound notifications when sessions change
 * - Persists user preferences in localStorage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUSMarketSession,
  getTASEMarketSession,
  type USMarketSession,
  type TASEMarketSession,
} from '@/lib/marketSessionEngine';
import { toast } from 'sonner';

const STORAGE_KEY = 'market-alerts-enabled';

// Sound frequencies for different session types
const SOUND_CONFIG = {
  MARKET_OPEN: { frequency: 880, duration: 150, type: 'sine' as OscillatorType }, // High pitch - market open
  PRE_MARKET: { frequency: 660, duration: 100, type: 'sine' as OscillatorType }, // Medium pitch - pre-market
  AFTER_HOURS: { frequency: 440, duration: 100, type: 'sine' as OscillatorType }, // Lower pitch - after hours
  CLOSED: { frequency: 330, duration: 200, type: 'triangle' as OscillatorType }, // Low pitch - closed
  OPEN: { frequency: 880, duration: 150, type: 'sine' as OscillatorType }, // TASE open
  PRE_OPEN: { frequency: 660, duration: 100, type: 'sine' as OscillatorType }, // TASE pre-open
  AUCTION: { frequency: 550, duration: 100, type: 'sine' as OscillatorType }, // TASE auction
};

// Play a notification sound using Web Audio API
function playNotificationSound(status: string): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const config = SOUND_CONFIG[status as keyof typeof SOUND_CONFIG] || SOUND_CONFIG.CLOSED;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
    oscillator.type = config.type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + config.duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration / 1000);

    // For MARKET OPEN, play a double beep
    if (status === 'MARKET OPEN' || status === 'OPEN') {
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.setValueAtTime(config.frequency * 1.25, audioContext.currentTime);
        osc2.type = config.type;
        gain2.gain.setValueAtTime(0, audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.15);
      }, 200);
    }
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

export function useMarketAlerts() {
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const lastUSStatus = useRef<USMarketSession | null>(null);
  const lastTASEStatus = useRef<TASEMarketSession | null>(null);
  const isInitialized = useRef(false);

  // Toggle alerts on/off
  const toggleAlerts = useCallback(() => {
    setAlertsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      
      if (newValue) {
        // Play a test sound when enabling
        playNotificationSound('PRE_MARKET');
        toast.success('Market alerts enabled', {
          description: 'You will hear sounds when market sessions change',
        });
      } else {
        toast.info('Market alerts disabled');
      }
      
      return newValue;
    });
  }, []);

  // Monitor market session changes
  useEffect(() => {
    if (!alertsEnabled) return;

    const checkSessions = () => {
      const now = new Date();
      const usSession = getUSMarketSession(now);
      const taseSession = getTASEMarketSession(now);

      // Skip first check (initialization)
      if (!isInitialized.current) {
        lastUSStatus.current = usSession.status as USMarketSession;
        lastTASEStatus.current = taseSession.status as TASEMarketSession;
        isInitialized.current = true;
        return;
      }

      // Check US market change
      if (lastUSStatus.current && usSession.status !== lastUSStatus.current) {
        playNotificationSound(usSession.status);
        toast(`US Market: ${usSession.status}`, {
          description: getSessionDescription('US', usSession.status),
          duration: 5000,
        });
        lastUSStatus.current = usSession.status as USMarketSession;
      }

      // Check TASE change
      if (lastTASEStatus.current && taseSession.status !== lastTASEStatus.current) {
        playNotificationSound(taseSession.status);
        toast(`TASE: ${taseSession.status}`, {
          description: getSessionDescription('TASE', taseSession.status),
          duration: 5000,
        });
        lastTASEStatus.current = taseSession.status as TASEMarketSession;
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSessions, 30000);
    
    // Initial check
    checkSessions();

    return () => clearInterval(interval);
  }, [alertsEnabled]);

  // Reset initialization when alerts are toggled
  useEffect(() => {
    if (!alertsEnabled) {
      isInitialized.current = false;
      lastUSStatus.current = null;
      lastTASEStatus.current = null;
    }
  }, [alertsEnabled]);

  return {
    alertsEnabled,
    toggleAlerts,
  };
}

function getSessionDescription(market: 'US' | 'TASE', status: string): string {
  const descriptions: Record<string, string> = {
    'MARKET OPEN': 'Regular trading session has started',
    'PRE-MARKET': 'Pre-market trading is now active',
    'AFTER-HOURS': 'After-hours trading has begun',
    'CLOSED': 'Market is now closed',
    'OPEN': 'Regular trading session has started',
    'PRE-OPEN': 'Pre-open phase has begun',
    'AUCTION': 'Closing auction is in progress',
  };
  
  return descriptions[status] || `${market} session changed to ${status}`;
}

export default useMarketAlerts;
