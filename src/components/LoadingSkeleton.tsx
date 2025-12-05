import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoadingSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[200px] border-r border-border bg-secondary/30 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-8 bg-primary/20" />
          <div>
            <Skeleton className="h-4 w-16 bg-primary/20" />
            <Skeleton className="h-2 w-12 mt-1 bg-muted" />
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full bg-muted/30" />
        ))}
      </div>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-secondary border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24 bg-primary/30" />
            <Skeleton className="h-4 w-32 bg-muted/30" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-8 bg-muted/30" />
            <Skeleton className="h-4 w-20 bg-muted/30" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-40 bg-muted/40" />
              <Skeleton className="h-3 w-56 mt-1 bg-muted/20" />
            </div>
            <Skeleton className="h-7 w-20 bg-muted/30" />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bloomberg-panel p-3">
                <Skeleton className="h-3 w-24 bg-muted/30 mb-2" />
                <Skeleton className="h-6 w-20 bg-primary/20" />
                <Skeleton className="h-2 w-16 mt-1 bg-muted/20" />
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bloomberg-panel p-3">
                <Skeleton className="h-2 w-16 bg-muted/30 mb-2" />
                <Skeleton className="h-5 w-14 bg-muted/40" />
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bloomberg-panel">
                <div className="bloomberg-header">
                  <Skeleton className="h-3 w-32 bg-muted/30" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-[200px] w-full bg-muted/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <p className="text-primary font-mono text-sm tracking-wider">SUFOX CAPITAL</p>
          <p className="text-muted-foreground text-xs font-mono">Initializing secure session...</p>
        </div>
      </div>
    </div>
  );
}