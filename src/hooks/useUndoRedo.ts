import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoResult<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initialState: T) => void;
}

const MAX_HISTORY_LENGTH = 50;

export function useUndoRedo<T>(initialState: T): UseUndoRedoResult<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoing = useRef(false);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prev.present) 
        : newState;
      
      // Don't add to history if state hasn't changed
      if (JSON.stringify(resolvedState) === JSON.stringify(prev.present)) {
        return prev;
      }

      // Limit history length
      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY_LENGTH);

      return {
        past: newPast,
        present: resolvedState,
        future: [], // Clear future when new action is taken
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];
      const newFuture = [prev.present, ...prev.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];
      const newPast = [...prev.past, prev.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
  };
}

// Combined state hook for multiple values with single undo/redo
interface ReportBuilderState<B, R> {
  blocks: B;
  branding: R;
}

export function useReportBuilderHistory<B, R>(
  initialBlocks: B,
  initialBranding: R
) {
  const {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  } = useUndoRedo<ReportBuilderState<B, R>>({
    blocks: initialBlocks,
    branding: initialBranding,
  });

  const setBlocks = useCallback((newBlocks: B | ((prev: B) => B)) => {
    setState((prev) => ({
      ...prev,
      blocks: typeof newBlocks === 'function' 
        ? (newBlocks as (prev: B) => B)(prev.blocks) 
        : newBlocks,
    }));
  }, [setState]);

  const setBranding = useCallback((newBranding: R | ((prev: R) => R)) => {
    setState((prev) => ({
      ...prev,
      branding: typeof newBranding === 'function' 
        ? (newBranding as (prev: R) => R)(prev.branding) 
        : newBranding,
    }));
  }, [setState]);

  const resetState = useCallback((blocks: B, branding: R) => {
    reset({ blocks, branding });
  }, [reset]);

  return {
    blocks: state.blocks,
    branding: state.branding,
    setBlocks,
    setBranding,
    undo,
    redo,
    canUndo,
    canRedo,
    resetState,
  };
}
