 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Slider } from '@/components/ui/slider';
 import { Separator } from '@/components/ui/separator';
 import { Progress } from '@/components/ui/progress';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Save, Plus, Trash2, Wand2, ChevronRight, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
 import { useWorkspaceAllocations } from '@/hooks/useWorkspaceAllocations';
 import { useWorkspaceAssumptions } from '@/hooks/useWorkspaceAssumptions';
 import type { WorkspaceAllocation, LiquidityBucket } from '@/types/workspaces';
 import { cn } from '@/lib/utils';
 
 interface ConstructionStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 const liquidityLabels: Record<LiquidityBucket, string> = {
   t0: 'T+0 (Immediate)',
   t30: 'T+30 (Monthly)',
   t90: 'T+90 (Quarterly)',
   locked: 'Locked',
 };
 
 export function ConstructionStage({ workspaceId, onComplete }: ConstructionStageProps) {
   const { flatAllocations, isLoading, upsertAllocation, deleteAllocation, initializeFromAssumptions } = useWorkspaceAllocations(workspaceId);
   const { assumptions } = useWorkspaceAssumptions(workspaceId);
   const [expanded, setExpanded] = useState<Set<string>>(new Set());
 
   const totalWeight = flatAllocations
     .filter(a => a.level === 0)
     .reduce((acc, a) => acc + a.weight, 0);
 
   const isValid = Math.abs(totalWeight - 100) < 0.01;
 
   const handleInitialize = async () => {
     const defaultAllocations = assumptions.map((a, i) => ({
       asset_class: a.asset_class,
       weight: Math.round(100 / assumptions.length),
       liquidity_bucket: (i < 2 ? 't0' : i < 5 ? 't30' : i < 8 ? 't90' : 'locked') as LiquidityBucket,
     }));
     await initializeFromAssumptions.mutateAsync(defaultAllocations);
   };
 
   const handleUpdateWeight = async (allocation: WorkspaceAllocation, weight: number) => {
     await upsertAllocation.mutateAsync({
       ...allocation,
       weight,
     });
   };
 
   const handleUpdateLiquidity = async (allocation: WorkspaceAllocation, liquidity_bucket: LiquidityBucket) => {
     await upsertAllocation.mutateAsync({
       ...allocation,
       liquidity_bucket,
     });
   };
 
   if (isLoading) {
     return <div className="p-8 text-center text-muted-foreground">Loading allocations...</div>;
   }
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Portfolio Construction</h2>
           <p className="text-muted-foreground mt-1">
             Build the hierarchical allocation structure. Total must equal 100%.
           </p>
         </div>
         <div className="flex gap-2">
           {flatAllocations.length === 0 && assumptions.length > 0 && (
             <Button variant="outline" onClick={handleInitialize}>
               <Wand2 className="h-4 w-4 mr-2" />
               Initialize from Assumptions
             </Button>
           )}
           <Button onClick={onComplete} disabled={!isValid}>
             <Save className="h-4 w-4 mr-2" />
             Save & Continue
           </Button>
         </div>
       </div>
 
       {/* Validation Status */}
       <Card className={cn(
         "border-2",
         isValid ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"
       )}>
         <CardContent className="py-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               {isValid ? (
                 <CheckCircle2 className="h-5 w-5 text-green-500" />
               ) : (
                 <AlertCircle className="h-5 w-5 text-orange-500" />
               )}
               <div>
                 <div className="font-medium">
                   {isValid ? 'Allocation Valid' : 'Allocation Incomplete'}
                 </div>
                 <div className="text-sm text-muted-foreground">
                   Total: {totalWeight.toFixed(1)}% / 100%
                 </div>
               </div>
             </div>
             <div className="w-64">
               <Progress 
                 value={Math.min(totalWeight, 100)} 
                 className={cn(
                   "h-2",
                   totalWeight > 100 && "[&>div]:bg-destructive"
                 )}
               />
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Allocations Table */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg">Allocation Weights</CardTitle>
           <CardDescription>
             Assign weights to each asset class. Sub-allocations can be added for strategies and vehicles.
           </CardDescription>
         </CardHeader>
         <CardContent>
           {flatAllocations.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <p>No allocations yet.</p>
               <p className="text-sm mt-1">Initialize from assumptions or add asset classes manually.</p>
             </div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[250px]">Asset Class</TableHead>
                   <TableHead className="w-[200px]">Weight</TableHead>
                   <TableHead className="w-[150px]">Liquidity</TableHead>
                   <TableHead className="w-[80px]"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {flatAllocations
                   .filter(a => a.level === 0)
                   .map((allocation) => (
                     <TableRow key={allocation.id}>
                       <TableCell className="font-medium">
                         <div className="flex items-center gap-2">
                           {allocation.name}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-3">
                           <Slider
                             value={[allocation.weight]}
                             onValueChange={([v]) => handleUpdateWeight(allocation, v)}
                             max={100}
                             step={0.5}
                             className="w-32"
                           />
                           <Input
                             type="number"
                             step="0.5"
                             className="w-20 h-8"
                             value={allocation.weight}
                             onChange={(e) => handleUpdateWeight(allocation, parseFloat(e.target.value) || 0)}
                           />
                           <span className="text-muted-foreground">%</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <Select
                           value={allocation.liquidity_bucket}
                           onValueChange={(v) => handleUpdateLiquidity(allocation, v as LiquidityBucket)}
                         >
                           <SelectTrigger className="h-8 w-[140px]">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {Object.entries(liquidityLabels).map(([value, label]) => (
                               <SelectItem key={value} value={value}>{label}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </TableCell>
                       <TableCell>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-muted-foreground hover:text-destructive"
                           onClick={() => deleteAllocation.mutate(allocation.id)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>
 
       <Separator />
 
       <div className="flex justify-between">
         <div className="text-sm text-muted-foreground">
           {!isValid && (
             <span className="text-orange-400">
               Adjust weights to equal 100% before continuing
             </span>
           )}
         </div>
         <Button onClick={onComplete} size="lg" disabled={!isValid}>
           <Save className="h-4 w-4 mr-2" />
           Save Construction & Continue
         </Button>
       </div>
     </div>
   );
 }