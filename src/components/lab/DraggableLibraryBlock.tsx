import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { AnalyticsBlockLibraryItem } from '@/types/analyticsLab';

interface DraggableLibraryBlockProps {
  block: AnalyticsBlockLibraryItem;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  onClick: () => void;
}

export function DraggableLibraryBlock({ block, icon: Icon, onClick }: DraggableLibraryBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${block.type}`,
    data: {
      type: 'library-block',
      blockType: block.type,
    },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left",
        "bg-muted/30 hover:bg-muted/50 border border-border hover:border-muted-foreground/30",
        "transition-all duration-150 touch-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div 
        className="p-1.5 rounded-md shrink-0"
        style={{ backgroundColor: `${block.color}20` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: block.color }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground truncate">
          {block.label}
        </div>
        <div className="text-[10px] text-muted-foreground line-clamp-1">
          {block.description}
        </div>
      </div>
    </button>
  );
}

export function DragOverlayBlock({ block, icon: Icon }: { block: AnalyticsBlockLibraryItem; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 p-2.5 rounded-lg",
        "bg-card border-2 border-primary shadow-xl",
        "cursor-grabbing"
      )}
      style={{ width: 200 }}
    >
      <div 
        className="p-1.5 rounded-md shrink-0"
        style={{ backgroundColor: `${block.color}20` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: block.color }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-foreground truncate">
          {block.label}
        </div>
        <div className="text-[10px] text-muted-foreground line-clamp-1">
          {block.description}
        </div>
      </div>
    </div>
  );
}
