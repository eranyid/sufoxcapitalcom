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
   setPersonalContext: () => void;
   setClientContext: (clientId: string, clientName: string, systemType: SystemType) => void;
   clearContext: () => void;
 }
 
 const defaultSession: SessionContext = {
   scope: null,
   clientId: null,
   clientName: null,
   systemType: null,
 };
 
 const SessionContextProvider = createContext<SessionContextValue | undefined>(undefined);
 
 export function SessionProvider({ children }: { children: React.ReactNode }) {
   const [session, setSession] = useState<SessionContext>(defaultSession);
 
   const isContextSet = session.scope !== null;
 
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
 
   return (
     <SessionContextProvider.Provider value={{
       session,
       isContextSet,
       setPersonalContext,
       setClientContext,
       clearContext,
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