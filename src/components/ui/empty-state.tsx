import { LucideIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Reusable EmptyState component for consistent "no data" messaging across the app.
 * Used in charts, tables, and any data-driven component when there's no data to display.
 */
export function EmptyState({ 
  icon: Icon = AlertCircle, 
  title, 
  description,
  className,
  iconClassName
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-8 px-4", className)}>
      <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-3 border border-border/30">
        <Icon className={cn("h-5 w-5 text-muted-foreground/50", iconClassName)} />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      {description && (
        <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}
