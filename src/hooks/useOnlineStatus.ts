import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  });
  
  // Track if we've had at least one offline event before showing "back online"
  const hasBeenOfflineRef = useRef(false);

  const handleOnline = useCallback(() => {
    setStatus(prev => {
      // Only show toast if we were actually offline before (not on initial load)
      if (hasBeenOfflineRef.current && !prev.isOnline) {
        toast({
          title: "Back online",
          description: "Connection restored – data synced",
          duration: 3000,
        });
      }
      return { isOnline: true, wasOffline: false };
    });
  }, []);

  const handleOffline = useCallback(() => {
    hasBeenOfflineRef.current = true;
    setStatus({ isOnline: false, wasOffline: true });
    toast({
      title: "You're offline",
      description: "Some features may be unavailable",
      variant: "destructive",
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync initial state with actual browser status
    const currentOnline = navigator.onLine;
    setStatus({
      isOnline: currentOnline,
      wasOffline: !currentOnline,
    });
    
    // If starting offline, mark it
    if (!currentOnline) {
      hasBeenOfflineRef.current = true;
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
