import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * This component handles the OAuth callback from Google.
 * It can work in two modes:
 * 1. Popup mode: Posts the code back to the parent window
 * 2. Redirect mode: Exchanges the code directly
 */
export function GoogleCalendarCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(error === 'access_denied' ? 'Access was denied' : error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received');
        return;
      }

      // Check if we're in a popup
      const isPopup = window.opener && window.opener !== window;

      if (isPopup) {
        // Post message to parent and close
        try {
          window.opener.postMessage(
            { type: 'google-oauth-callback', code },
            window.location.origin
          );
          setStatus('success');
          setTimeout(() => window.close(), 1000);
        } catch (err) {
          setStatus('error');
          setErrorMessage('Failed to communicate with parent window');
        }
      } else {
        // Direct redirect mode - exchange code ourselves
        try {
          const redirectUri = `${window.location.origin}/calendar`;
          
          const { error: exchangeError } = await supabase.functions.invoke('gcal-auth', {
            body: {
              action: 'exchange_code',
              code,
              redirectUri,
            },
          });

          if (exchangeError) {
            throw exchangeError;
          }

          setStatus('success');
          
          // Clean URL and reload to show connected state
          window.history.replaceState({}, document.title, '/calendar');
          window.location.reload();
        } catch (err) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Failed to connect');
        }
      }
    };

    handleCallback();
  }, []);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connecting to Google Calendar...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <CheckCircle className="h-8 w-8 text-emerald-500" />
        <p className="text-sm text-foreground">Connected successfully!</p>
        <p className="text-xs text-muted-foreground">This window will close automatically...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <XCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-foreground">Connection failed</p>
      <p className="text-xs text-muted-foreground">{errorMessage}</p>
    </div>
  );
}
