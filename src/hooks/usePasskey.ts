import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Helper functions for base64url encoding/decoding
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function usePasskey() {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 
        typeof window !== 'undefined' &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
      
      if (supported) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    
    checkSupport();
  }, []);

  // Check if current user has a passkey registered
  const checkHasPasskey = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('passkey_credentials')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      setHasPasskey(data && data.length > 0);
    } catch {
      setHasPasskey(false);
    }
  }, []);

  // Register a new passkey
  const registerPasskey = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        variant: "destructive",
        title: "Not supported",
        description: "Face ID / Touch ID is not available on this device."
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get challenge from server
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
        'passkey-register',
        {
          body: { action: 'get-challenge' },
        }
      );

      if (challengeError) throw challengeError;

      const { challenge, userId, userEmail, rpName } = challengeData;
      
      // Get the current origin's hostname for rpId
      const rpId = window.location.hostname;

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToBuffer(challenge),
        rp: {
          name: rpName,
          id: rpId,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userEmail.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      // Create the credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Store credential on server
      const { error: storeError } = await supabase.functions.invoke(
        'passkey-register',
        {
          body: {
            action: 'store-credential',
            credentialId: bufferToBase64url(credential.rawId),
            publicKey: bufferToBase64url(response.getPublicKey()!),
            counter: 0,
            deviceType: 'platform',
            transports: response.getTransports?.() || ['internal'],
          },
        }
      );

      if (storeError) throw storeError;

      setHasPasskey(true);
      toast({
        title: "Face ID enabled",
        description: "You can now sign in with Face ID on this device."
      });
      
      return true;
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          variant: "destructive",
          title: "Cancelled",
          description: "Face ID setup was cancelled."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Setup failed",
          description: error.message || "Failed to set up Face ID."
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, toast]);

  // Authenticate with passkey
  const authenticateWithPasskey = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        variant: "destructive",
        title: "Not supported",
        description: "Face ID / Touch ID is not available on this device."
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      // Get challenge from server
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
        'passkey-authenticate',
        {
          body: { action: 'get-challenge' },
        }
      );

      if (challengeError) throw challengeError;

      const { challenge, allowCredentials } = challengeData;
      const rpId = window.location.hostname;

      // Create assertion options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(challenge),
        rpId,
        allowCredentials: allowCredentials.map((id: string) => ({
          id: base64urlToBuffer(id),
          type: 'public-key' as const,
          transports: ['internal'] as AuthenticatorTransport[],
        })),
        userVerification: 'required',
        timeout: 60000,
      };

      // Get the credential
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Authentication failed');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      const credentialId = bufferToBase64url(assertion.rawId);

      // Verify credential and get session
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'passkey-authenticate',
        {
          body: {
            action: 'verify-credential',
            credentialId,
            newCounter: response.authenticatorData ? 
              new DataView(response.authenticatorData).getUint32(33, false) : 0,
          },
        }
      );

      if (verifyError) throw verifyError;

      // Use the magic link token to sign in
      if (verifyData.token) {
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: verifyData.tokenHash,
          type: 'magiclink',
        });

        if (signInError) throw signInError;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in with Face ID."
      });
      
      return true;
    } catch (error: any) {
      console.error('Passkey auth error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          variant: "destructive",
          title: "Cancelled",
          description: "Face ID authentication was cancelled."
        });
      } else if (error.message?.includes('not found')) {
        toast({
          variant: "destructive",
          title: "No passkey found",
          description: "Please sign in with email and password first, then set up Face ID."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: error.message || "Face ID authentication failed. Please try again or use email/password."
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, toast]);

  return {
    isSupported,
    hasPasskey,
    isLoading,
    checkHasPasskey,
    registerPasskey,
    authenticateWithPasskey,
  };
}
