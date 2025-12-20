import { useState, useEffect, useCallback } from 'react';
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

  const handleOnline = useCallback(() => {
    setStatus(prev => {
      // Only show toast if we were actually offline before
      if (!prev.isOnline || prev.wasOffline) {
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
    setStatus({ isOnline: false, wasOffline: true });
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setStatus({
      isOnline: navigator.onLine,
      wasOffline: false,
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
