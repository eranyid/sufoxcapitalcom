import { CalendarIcon } from '@/components/icons/CalendarIcon';

export default function Calendar() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarIcon size={20} className="text-primary" />
        <h2 className="text-lg font-semibold">Calendar</h2>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CalendarIcon size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Coming Soon</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Calendar functionality will be added here.
        </p>
      </div>
    </div>
  );
}
