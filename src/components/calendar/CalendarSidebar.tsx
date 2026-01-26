import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  showInternal: boolean;
  showGoogle: boolean;
  onToggleInternal: (show: boolean) => void;
  onToggleGoogle: (show: boolean) => void;
  hasGoogleIntegration: boolean;
}

export function CalendarSidebar({
  currentDate,
  onDateChange,
  showInternal,
  showGoogle,
  onToggleInternal,
  onToggleGoogle,
  hasGoogleIntegration
}: CalendarSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <div className="bg-card border border-border rounded-lg p-3">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => date && onDateChange(date)}
          className="p-0 pointer-events-auto"
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-xs font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted"
            ),
            nav_button_previous: "absolute left-0",
            nav_button_next: "absolute right-0",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground w-7 font-normal text-[10px]",
            row: "flex w-full mt-1",
            cell: cn(
              "relative p-0 text-center text-xs focus-within:relative",
              "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            ),
            day: cn(
              "h-7 w-7 p-0 font-normal text-[11px] rounded-md transition-colors",
              "hover:bg-muted focus:bg-muted"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
          }}
        />
      </div>

      {/* Calendars Filter */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Calendars
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <Label htmlFor="internal" className="text-sm font-medium cursor-pointer">
                Internal
              </Label>
            </div>
            <Switch
              id="internal"
              checked={showInternal}
              onCheckedChange={onToggleInternal}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                hasGoogleIntegration ? "bg-red-500" : "bg-muted-foreground/30"
              )} />
              <Label 
                htmlFor="google" 
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  !hasGoogleIntegration && "text-muted-foreground"
                )}
              >
                Google
              </Label>
            </div>
            <Switch
              id="google"
              checked={showGoogle}
              onCheckedChange={onToggleGoogle}
              disabled={!hasGoogleIntegration}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
