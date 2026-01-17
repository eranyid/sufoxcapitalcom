import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FxMode = 'real' | 'nominal';

interface FxModeContextType {
  fxMode: FxMode;
  setFxMode: (mode: FxMode) => void;
  toggleFxMode: () => void;
  fxLabel: string;
}

const FxModeContext = createContext<FxModeContextType | undefined>(undefined);

const STORAGE_KEY = 'sufox-fx-mode';

export function FxModeProvider({ children }: { children: ReactNode }) {
  const [fxMode, setFxModeState] = useState<FxMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'real' || stored === 'nominal') {
        return stored;
      }
    }
    return 'real'; // Default to Real (FX-adjusted)
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fxMode);
  }, [fxMode]);

  const setFxMode = (mode: FxMode) => {
    setFxModeState(mode);
  };

  const toggleFxMode = () => {
    setFxModeState(prev => prev === 'real' ? 'nominal' : 'real');
  };

  const fxLabel = fxMode === 'real' ? 'Real (FX-adjusted)' : 'Nominal (FX-neutral)';

  return (
    <FxModeContext.Provider value={{ fxMode, setFxMode, toggleFxMode, fxLabel }}>
      {children}
    </FxModeContext.Provider>
  );
}

export function useFxMode() {
  const context = useContext(FxModeContext);
  if (context === undefined) {
    throw new Error('useFxMode must be used within a FxModeProvider');
  }
  return context;
}
