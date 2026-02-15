import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const evaluationCriteria = [
  { criteria: 'Leverage vs Industry', benchmark: '4.0–6.0x', placeholder: '' },
  { criteria: 'Pricing vs Market Spreads', benchmark: 'S+400–600', placeholder: '' },
  { criteria: 'Covenant Strength', benchmark: '2+ maintenance', placeholder: '' },
  { criteria: 'Equity Cushion', benchmark: '>30%', placeholder: '' },
  { criteria: 'Structural Protections', benchmark: 'Standard', placeholder: '' },
];

type Rating = 'conservative' | 'standard' | 'aggressive' | null;

export function DealConventionalityAnalyzer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState<Rating>(null);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <Scale size={14} className="text-primary" />
            </div>
            <div>
              <span>Deal Conventionality Analyzer</span>
              <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Determine if deal structure fits market norms</p>
            </div>
          </CardTitle>
          <Button
            size="sm"
            variant={isExpanded ? 'default' : 'outline'}
            className="text-[10px] h-7 gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Open Analyzer'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5">
          {/* Evaluation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-2 text-muted-foreground">Criteria</th>
                  <th className="text-center p-2 text-muted-foreground">Market Benchmark</th>
                  <th className="text-center p-2 text-muted-foreground">Deal Value</th>
                  <th className="text-center p-2 text-muted-foreground">Assessment</th>
                </tr>
              </thead>
              <tbody>
                {evaluationCriteria.map((c) => (
                  <tr key={c.criteria} className="border-b border-border/20">
                    <td className="p-2 text-foreground/80">{c.criteria}</td>
                    <td className="text-center p-2 text-muted-foreground">{c.benchmark}</td>
                    <td className="text-center p-2">
                      <Input
                        className="h-7 text-[10px] font-mono bg-muted/20 border-border/50 w-24 mx-auto text-center"
                        placeholder="Enter"
                      />
                    </td>
                    <td className="text-center p-2">
                      <Badge variant="outline" className="text-[8px]">Pending</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Overall Rating */}
          <div className="flex items-center gap-3 justify-center py-3">
            {(['conservative', 'standard', 'aggressive'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-sm border text-[10px] font-medium transition-all",
                  rating === r
                    ? r === 'conservative' ? "border-success/50 bg-success/10 text-success"
                    : r === 'standard' ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border/30 text-muted-foreground hover:bg-muted/30"
                )}
              >
                {r === 'conservative' && <CheckCircle2 size={12} />}
                {r === 'standard' && <AlertTriangle size={12} />}
                {r === 'aggressive' && <XCircle size={12} />}
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {rating && (
            <div className={cn(
              "p-3 rounded-sm border text-[10px]",
              rating === 'conservative' && "border-success/20 bg-success/5 text-success",
              rating === 'standard' && "border-primary/20 bg-primary/5 text-primary",
              rating === 'aggressive' && "border-destructive/20 bg-destructive/5 text-destructive",
            )}>
              <p className="font-semibold mb-1">
                Deal Classification: {rating.charAt(0).toUpperCase() + rating.slice(1)}
              </p>
              <p className="text-[9px] opacity-80">
                {rating === 'conservative' && 'Deal terms are within or below market norms. Lower risk profile, potentially lower returns.'}
                {rating === 'standard' && 'Deal terms align with current market standards. Balanced risk/return profile.'}
                {rating === 'aggressive' && 'Deal terms exceed market norms. Higher risk requiring additional scrutiny and protections.'}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
