import { BarChart3, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisShareCardProps {
  title: string;
  type: string;
  snapshot: Record<string, unknown> | null;
  senderName: string;
}

const typeLabels: Record<string, string> = {
  dcf: 'DCF Valuation',
  risk: 'Risk Analysis',
  allocation: 'Allocation',
  scenario: 'Scenario Analysis',
  research: 'Research Note',
  unknown: 'Analysis',
};

export function AnalysisShareCard({ title, type, snapshot, senderName }: AnalysisShareCardProps) {
  return (
    <div className="border border-primary/30 rounded-md bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-primary/20 flex items-center justify-center">
          <BarChart3 size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{title}</p>
          <p className="text-[10px] text-primary font-mono uppercase tracking-wider">
            {typeLabels[type] || type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1 gap-1">
          <Eye size={10} /> View
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1 gap-1">
          <Download size={10} /> Import
        </Button>
      </div>
    </div>
  );
}
