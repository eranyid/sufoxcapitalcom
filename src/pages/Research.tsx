import { Search } from 'lucide-react';
import ChartLab from '@/components/research/ChartLab';

const Research = () => {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-mono text-foreground tracking-tight">RESEARCH</h1>
      </div>

      {/* Chart Lab */}
      <ChartLab />
    </div>
  );
};

export default Research;
