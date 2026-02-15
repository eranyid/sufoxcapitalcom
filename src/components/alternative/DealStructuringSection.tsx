import { LBOCalculator } from './LBOCalculator';
import { PrivateCreditCalculator } from './PrivateCreditCalculator';
import { DealConventionalityAnalyzer } from './DealConventionalityAnalyzer';

export function DealStructuringSection() {
  return (
    <div className="space-y-5">
      <div>
        <p className="terminal-label text-[9px]">DEAL STRUCTURING & FINANCIAL CALCULATORS</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Excel-like financial modeling environment</p>
      </div>

      <LBOCalculator />
      <PrivateCreditCalculator />
      <DealConventionalityAnalyzer />
    </div>
  );
}
