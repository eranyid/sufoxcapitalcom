import { useState, useCallback, useRef, useEffect } from 'react';
import { GRID_ROW_HEIGHT, GRID_COLUMNS } from '@/types/reportBuilder';

interface ResizeState {
  isResizing: boolean;
  direction: 'right' | 'bottom' | 'corner' | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface UseBlockResizeProps {
  blockId: string;
  colSpan: number;
  height: number;
  scale: number;
  containerWidth: number;
  onResize: (blockId: string, colSpan: number, height: number) => void;
}

export function useBlockResize({
  blockId,
  colSpan,
  height,
  scale,
  containerWidth,
  onResize,
}: UseBlockResizeProps) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    direction: null,
    startX: 0,
    startY: 0,
    startWidth: colSpan,
    startHeight: height,
  });

  const previewRef = useRef<{ colSpan: number; height: number }>({
    colSpan,
    height,
  });

  // Calculate column width
  const colWidth = containerWidth / GRID_COLUMNS;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
      e.preventDefault();
      e.stopPropagation();
      
      setResizeState({
        isResizing: true,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: colSpan,
        startHeight: height,
      });
      
      previewRef.current = { colSpan, height };
    },
    [colSpan, height]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeState.isResizing) return;

      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;

      let newColSpan = resizeState.startWidth;
      let newHeight = resizeState.startHeight;

      // Calculate new column span
      if (resizeState.direction === 'right' || resizeState.direction === 'corner') {
        const colDelta = Math.round(deltaX / (colWidth * scale));
        newColSpan = Math.max(1, Math.min(GRID_COLUMNS, resizeState.startWidth + colDelta)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
      }

      // Calculate new height
      if (resizeState.direction === 'bottom' || resizeState.direction === 'corner') {
        const rowDelta = Math.round(deltaY / (GRID_ROW_HEIGHT * scale));
        newHeight = Math.max(1, resizeState.startHeight + rowDelta);
      }

      previewRef.current = { colSpan: newColSpan, height: newHeight };
      
      // Update in real-time for visual feedback
      onResize(blockId, newColSpan, newHeight);
    },
    [resizeState, colWidth, scale, blockId, onResize]
  );

  const handleMouseUp = useCallback(() => {
    if (resizeState.isResizing) {
      // Finalize resize
      onResize(blockId, previewRef.current.colSpan, previewRef.current.height);
      
      setResizeState({
        isResizing: false,
        direction: null,
        startX: 0,
        startY: 0,
        startWidth: colSpan,
        startHeight: height,
      });
    }
  }, [resizeState.isResizing, blockId, colSpan, height, onResize]);

  useEffect(() => {
    if (resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizeState.isResizing, handleMouseMove, handleMouseUp]);

  return {
    isResizing: resizeState.isResizing,
    handleMouseDown,
  };
}
