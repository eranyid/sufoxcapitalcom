export default function Calendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">Calendar</h1>
        <p className="text-sm text-muted-foreground">Manage your schedule and events</p>
      </div>

      {/* Empty state - ready for content */}
      <div className="bloomberg-panel p-8">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 border border-border/30">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-muted-foreground">Calendar content will be added here</p>
        </div>
      </div>
    </div>
  );
}
