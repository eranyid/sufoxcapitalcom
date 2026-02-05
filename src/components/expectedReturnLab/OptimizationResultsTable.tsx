 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { OptimizationResult } from '@/types/expectedReturnLab';
 import { Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface OptimizationResultsTableProps {
   results: OptimizationResult[];
 }
 
 export function OptimizationResultsTable({ results }: OptimizationResultsTableProps) {
   if (results.length === 0) {
     return (
       <BloombergPanel
         title="Optimization Results"
         titleIcon={<Target className="h-4 w-4 text-primary" />}
       >
         <div className="p-8 text-center">
           <p className="text-sm text-muted-foreground">Run optimization to see results</p>
         </div>
       </BloombergPanel>
     );
   }
   
   return (
     <BloombergPanel
       title="Optimization Results"
       titleIcon={<Target className="h-4 w-4 text-primary" />}
       contentClassName="p-0"
     >
       <div className="overflow-x-auto">
         <Table>
           <TableHeader>
             <TableRow className="hover:bg-transparent">
               <TableHead className="text-xs">Asset Class</TableHead>
               <TableHead className="text-xs text-right">Implied E[R]</TableHead>
               <TableHead className="text-xs text-right">BL E[R]</TableHead>
               <TableHead className="text-xs text-right">Input Wt</TableHead>
               <TableHead className="text-xs text-right">Optimal Wt</TableHead>
               <TableHead className="text-xs text-right">Wt Δ</TableHead>
               <TableHead className="text-xs text-right">Risk %</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {results.map((result) => {
               const weightDelta = result.optimizedWeight - result.inputWeight;
               const returnDelta = result.posteriorReturn - result.impliedMarketReturn;
               
               return (
                 <TableRow key={result.assetClass}>
                   <TableCell className="py-2">
                     <span className="text-xs font-medium">{result.assetClass}</span>
                   </TableCell>
                   <TableCell className="py-2 text-right font-mono text-xs text-muted-foreground">
                     {result.impliedMarketReturn.toFixed(1)}%
                   </TableCell>
                   <TableCell className="py-2 text-right">
                     <div className="flex items-center justify-end gap-1">
                       <span className={cn(
                         "font-mono text-xs font-medium",
                         returnDelta > 0.5 ? 'text-success' : returnDelta < -0.5 ? 'text-destructive' : 'text-foreground'
                       )}>
                         {result.posteriorReturn.toFixed(1)}%
                       </span>
                       {Math.abs(returnDelta) > 0.5 && (
                         returnDelta > 0 
                           ? <ArrowUpRight className="h-3 w-3 text-success" />
                           : <ArrowDownRight className="h-3 w-3 text-destructive" />
                       )}
                     </div>
                   </TableCell>
                   <TableCell className="py-2 text-right font-mono text-xs text-muted-foreground">
                     {result.inputWeight.toFixed(1)}%
                   </TableCell>
                   <TableCell className="py-2 text-right font-mono text-xs font-medium text-foreground">
                     {result.optimizedWeight.toFixed(1)}%
                   </TableCell>
                   <TableCell className="py-2 text-right">
                     <span className={cn(
                       "font-mono text-xs",
                       weightDelta > 1 ? 'text-success' : weightDelta < -1 ? 'text-destructive' : 'text-muted-foreground'
                     )}>
                       {weightDelta >= 0 ? '+' : ''}{weightDelta.toFixed(1)}%
                     </span>
                   </TableCell>
                   <TableCell className="py-2">
                     <div className="flex items-center justify-end gap-2">
                       <div className="w-16 h-2 bg-muted/30 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-warning rounded-full"
                           style={{ width: `${Math.min(result.riskContribution, 100)}%` }}
                         />
                       </div>
                       <span className="font-mono text-xs text-muted-foreground w-10 text-right">
                         {result.riskContribution.toFixed(1)}%
                       </span>
                     </div>
                   </TableCell>
                 </TableRow>
               );
             })}
           </TableBody>
         </Table>
       </div>
     </BloombergPanel>
   );
 }