 import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
 
 export type OperatingScope = 'personal' | 'client';
 export type SystemType = 'terminal' | 'client_portfolio';
 
 export interface SessionContext {
   scope: OperatingScope | null;
   clientId: string | null;
   clientName: string | null;
   systemType: SystemType | null;
 }
 
 interface SessionContextValue {
   session: SessionContext;
   isContextSet: boolean;
  isClientContext: boolean;
   setPersonalContext: () => void;
   setClientContext: (clientId: string, clientName: string, systemType: SystemType) => void;
   clearContext: () => void;
  getClientIdForQuery: () => string | null;
 }
 
 const defaultSession: SessionContext = {
   scope: null,
   clientId: null,
   clientName: null,
   systemType: null,
 };
 
const STORAGE_KEY = 'sufox_session_context';

function loadSessionFromStorage(): SessionContext {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (parsed.scope && (parsed.scope === 'personal' || parsed.scope === 'client')) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load session from storage:', e);
  }
  return defaultSession;
}

function saveSessionToStorage(session: SessionContext) {
  try {
    if (session.scope) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save session to storage:', e);
  }
}

 const SessionContextProvider = createContext<SessionContextValue | undefined>(undefined);
 
 export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionContext>(() => loadSessionFromStorage());
 
   const isContextSet = session.scope !== null;
  const isClientContext = session.scope === 'client' && session.clientId !== null;

  // Persist to localStorage when session changes
  useEffect(() => {
    saveSessionToStorage(session);
  }, [session]);
 
   const setPersonalContext = useCallback(() => {
     setSession({
       scope: 'personal',
       clientId: null,
       clientName: null,
       systemType: 'terminal',
     });
   }, []);
 
   const setClientContext = useCallback((clientId: string, clientName: string, systemType: SystemType) => {
     setSession({
       scope: 'client',
       clientId,
       clientName,
       systemType,
     });
   }, []);
 
   const clearContext = useCallback(() => {
     setSession(defaultSession);
   }, []);
 
  // Helper to get client_id for database queries
  // Returns null for personal context (no client filter)
  // Returns clientId for client context
  const getClientIdForQuery = useCallback(() => {
    if (session.scope === 'client' && session.clientId) {
      return session.clientId;
    }
    return null;
  }, [session.scope, session.clientId]);

   return (
     <SessionContextProvider.Provider value={{
       session,
       isContextSet,
      isClientContext,
       setPersonalContext,
       setClientContext,
       clearContext,
      getClientIdForQuery,
     }}>
       {children}
     </SessionContextProvider.Provider>
   );
 }
 
 export function useSession() {
   const context = useContext(SessionContextProvider);
   if (context === undefined) {
     throw new Error('useSession must be used within a SessionProvider');
   }
   return context;
 }

// Custom hook for client-scoped queries
export function useClientScope() {
  const { session, isClientContext, getClientIdForQuery } = useSession();
  
  return {
    clientId: getClientIdForQuery(),
    isClientContext,
    clientName: session.clientName,
    // Use this in .eq() queries: .eq('client_id', clientId) when clientId is not null
    // Or use filter builder pattern
    buildClientFilter: <T extends { client_id?: string | null }>(query: any) => {
      const clientId = getClientIdForQuery();
      if (clientId) {
        return query.eq('client_id', clientId);
      }
      return query.is('client_id', null);
    },
  };
}