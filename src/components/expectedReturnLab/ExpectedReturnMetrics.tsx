 import { TrendingUp, Activity, Zap, BarChart3 } from 'lucide-react';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { PortfolioMetrics } from '@/types/expectedReturnLab';
 import { cn } from '@/lib/utils';
 
 interface ExpectedReturnMetricsProps {
   inputMetrics: PortfolioMetrics | null;
   optimizedMetrics: PortfolioMetrics | null;
   riskFreeRate: number;
 }
 
 export function ExpectedReturnMetrics({ 
   inputMetrics, 
   optimizedMetrics,
   riskFreeRate 
 }: ExpectedReturnMetricsProps) {
   
   const MetricCard = ({ 
     label, 
     inputValue, 
     optimizedValue, 
     format = 'percent',
     icon: Icon,
     highlight = false
   }: { 
     label: string; 
     inputValue: number | null; 
     optimizedValue: number | null;
     format?: 'percent' | 'ratio';
     icon: React.ElementType;
     highlight?: boolean;
   }) => {
     const formatValue = (val: number | null) => {
       if (val === null || !isFinite(val)) return '--';
       if (format === 'ratio') return val.toFixed(2);
       return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
     };
     
     const delta = (optimizedValue ?? 0) - (inputValue ?? 0);
     const isPositive = delta > 0.01;
     const isNegative = delta < -0.01;
     
     return (
       <div className={cn(
         "p-4 rounded-lg border",
         highlight ? 'bg-primary/5 border-primary/30' : 'bg-card/50 border-border/50'
       )}>
         <div className="flex items-center gap-2 mb-3">
           <div className="p-1.5 rounded-lg bg-primary/10">
             <Icon className="h-3.5 w-3.5 text-primary" />
           </div>
           <span className="text-xs text-muted-foreground font-medium">{label}</span>
         </div>
         
         <div className="grid grid-cols-2 gap-3">
           <div>
             <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Input</div>
             <div className="font-mono text-lg font-semibold text-foreground/70">
               {formatValue(inputValue)}
             </div>
           </div>
           <div>
             <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Optimized</div>
             <div className={cn(
               "font-mono text-lg font-semibold",
               highlight ? 'text-primary' : 'text-foreground'
             )}>
               {formatValue(optimizedValue)}
             </div>
           </div>
         </div>
         
         {inputValue !== null && optimizedValue !== null && Math.abs(delta) > 0.01 && (
           <div className={cn(
             "mt-2 pt-2 border-t border-border/30 text-xs font-mono",
             isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
           )}>
             Δ {delta >= 0 ? '+' : ''}{format === 'ratio' ? delta.toFixed(2) : `${delta.toFixed(2)}%`}
           </div>
         )}
       </div>
     );
   };
   
   return (
     <BloombergPanel
       title="Expected Portfolio Metrics"
       titleIcon={<BarChart3 className="h-4 w-4 text-primary" />}
       contentClassName="p-4"
     >
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <MetricCard
           label="Expected Return (Ann.)"
           inputValue={inputMetrics?.expectedReturn ?? null}
           optimizedValue={optimizedMetrics?.expectedReturn ?? null}
           icon={TrendingUp}
           highlight
         />
         <MetricCard
           label="Expected Volatility"
           inputValue={inputMetrics?.expectedVolatility ?? null}
           optimizedValue={optimizedMetrics?.expectedVolatility ?? null}
           icon={Activity}
         />
         <MetricCard
           label="Sharpe Ratio"
           inputValue={inputMetrics?.sharpeRatio ?? null}
           optimizedValue={optimizedMetrics?.sharpeRatio ?? null}
           format="ratio"
           icon={Zap}
           highlight
         />
         <MetricCard
           label="Diversification Ratio"
           inputValue={inputMetrics?.diversificationRatio ?? null}
           optimizedValue={optimizedMetrics?.diversificationRatio ?? null}
           format="ratio"
           icon={BarChart3}
         />
       </div>
       
       <div className="mt-4 pt-3 border-t border-border/30">
         <p className="text-[10px] text-muted-foreground font-mono">
           Sharpe = (E[R] - Rf) / σ where Rf = {riskFreeRate.toFixed(1)}%
         </p>
       </div>
     </BloombergPanel>
   );
 }