import { Search } from 'lucide-react';

const Research = () => {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-mono text-foreground tracking-tight">RESEARCH</h1>
      </div>

      {/* Placeholder Content */}
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-border rounded-lg bg-card/50">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-mono text-foreground mb-2">Research</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This page will host my research workspace. Content coming soon.
        </p>
      </div>
    </div>
  );
};

export default Research;
