 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Separator } from '@/components/ui/separator';
 import { Badge } from '@/components/ui/badge';
 import { Save, Wand2, FileText, CheckCircle2, Send } from 'lucide-react';
 import { useWorkspaceAllocations } from '@/hooks/useWorkspaceAllocations';
 import { useWorkspaceAssumptions } from '@/hooks/useWorkspaceAssumptions';
 import { useWorkspaceConstraints } from '@/hooks/useWorkspaceConstraints';
 
 interface NarrativeStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 export function NarrativeStage({ workspaceId, onComplete }: NarrativeStageProps) {
   const { flatAllocations } = useWorkspaceAllocations(workspaceId);
   const { assumptions } = useWorkspaceAssumptions(workspaceId);
   const { constraints } = useWorkspaceConstraints(workspaceId);
 
   const [narrative, setNarrative] = useState({
     executiveSummary: '',
     allocationRationale: '',
     riskExplanation: '',
     expectedOutcomes: '',
     governanceRules: '',
   });
 
   const generateNarrative = () => {
     // Auto-generate based on data
     const topAllocations = flatAllocations
       .filter(a => a.level === 0)
       .sort((a, b) => b.weight - a.weight)
       .slice(0, 3);
 
     const totalReturn = flatAllocations
       .filter(a => a.level === 0)
       .reduce((acc, alloc) => {
         const assumption = assumptions.find(a => a.asset_class === alloc.name);
         return acc + (alloc.weight / 100) * (assumption?.expected_return || 0);
       }, 0);
 
     setNarrative({
       executiveSummary: `This portfolio proposal is designed for a ${constraints?.investment_horizon_years || 10}-year investment horizon with a target return of ${constraints?.target_return_nominal || 7}% nominal (${constraints?.target_return_real || 5}% real). The allocation emphasizes diversification across ${flatAllocations.filter(a => a.level === 0).length} asset classes while maintaining liquidity requirements and concentration limits.`,
       
       allocationRationale: `The portfolio is anchored by ${topAllocations.map(a => `${a.name} (${a.weight.toFixed(1)}%)`).join(', ')}. This allocation reflects our forward-looking return expectations and risk considerations. Each asset class has been evaluated for its expected contribution to portfolio return and risk.`,
       
       riskExplanation: `Maximum drawdown tolerance is set at ${constraints?.max_drawdown || 20}%. The portfolio maintains at least ${constraints?.liquidity_t0_min_pct || 5}% in immediately liquid assets (T+0) and ${constraints?.liquidity_t30_min_pct || 15}% in monthly liquid assets (T+30). Single asset concentration is limited to ${constraints?.max_single_asset_pct || 20}% of the portfolio.`,
       
       expectedOutcomes: `Based on current assumptions, the portfolio is expected to generate an annualized return of approximately ${totalReturn.toFixed(1)}%. Under normal market conditions, the 95% confidence interval for annual returns ranges from -X% to +Y%. The Sharpe ratio is expected to be above 0.5.`,
       
       governanceRules: `This allocation will be reviewed quarterly. Rebalancing will be triggered if any asset class deviates by more than 5% from target weights. Annual review of assumptions and constraints is required. All changes require documented rationale in the version history.`,
     });
   };
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Client Narrative & Proposal</h2>
           <p className="text-muted-foreground mt-1">
             Convert analytics into AUM-ready output for client presentation.
           </p>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={generateNarrative}>
             <Wand2 className="h-4 w-4 mr-2" />
             Auto-Generate
           </Button>
           <Button onClick={onComplete}>
             <Save className="h-4 w-4 mr-2" />
             Save & Continue
           </Button>
         </div>
       </div>
 
       <div className="grid grid-cols-2 gap-6">
         {/* Left Column - Editor */}
         <div className="space-y-6">
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg">Executive Summary</CardTitle>
               <CardDescription>High-level overview for C-suite and trustees</CardDescription>
             </CardHeader>
             <CardContent>
               <Textarea
                 value={narrative.executiveSummary}
                 onChange={(e) => setNarrative(n => ({ ...n, executiveSummary: e.target.value }))}
                 placeholder="Enter executive summary..."
                 rows={4}
               />
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg">Allocation Rationale</CardTitle>
               <CardDescription>Why this allocation makes sense</CardDescription>
             </CardHeader>
             <CardContent>
               <Textarea
                 value={narrative.allocationRationale}
                 onChange={(e) => setNarrative(n => ({ ...n, allocationRationale: e.target.value }))}
                 placeholder="Explain the allocation rationale..."
                 rows={4}
               />
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg">Risk Explanation</CardTitle>
               <CardDescription>How risks are managed and mitigated</CardDescription>
             </CardHeader>
             <CardContent>
               <Textarea
                 value={narrative.riskExplanation}
                 onChange={(e) => setNarrative(n => ({ ...n, riskExplanation: e.target.value }))}
                 placeholder="Explain risk management approach..."
                 rows={4}
               />
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg">Expected Outcomes</CardTitle>
               <CardDescription>What to expect over the investment horizon</CardDescription>
             </CardHeader>
             <CardContent>
               <Textarea
                 value={narrative.expectedOutcomes}
                 onChange={(e) => setNarrative(n => ({ ...n, expectedOutcomes: e.target.value }))}
                 placeholder="Describe expected outcomes..."
                 rows={4}
               />
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg">Governance & Rebalancing Rules</CardTitle>
               <CardDescription>Ongoing management and review process</CardDescription>
             </CardHeader>
             <CardContent>
               <Textarea
                 value={narrative.governanceRules}
                 onChange={(e) => setNarrative(n => ({ ...n, governanceRules: e.target.value }))}
                 placeholder="Define governance rules..."
                 rows={4}
               />
             </CardContent>
           </Card>
         </div>
 
         {/* Right Column - Preview */}
         <div className="space-y-6">
           <Card className="sticky top-6">
             <CardHeader className="pb-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <FileText className="h-5 w-5 text-primary" />
                   <CardTitle className="text-lg">Proposal Preview</CardTitle>
                 </div>
                 <Badge variant="outline">Draft</Badge>
               </div>
             </CardHeader>
             <CardContent className="prose prose-sm dark:prose-invert max-w-none">
               {narrative.executiveSummary && (
                 <div className="mb-4">
                   <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Executive Summary</h4>
                   <p className="text-sm">{narrative.executiveSummary}</p>
                 </div>
               )}
               {narrative.allocationRationale && (
                 <div className="mb-4">
                   <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Allocation Rationale</h4>
                   <p className="text-sm">{narrative.allocationRationale}</p>
                 </div>
               )}
               {narrative.riskExplanation && (
                 <div className="mb-4">
                   <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk Management</h4>
                   <p className="text-sm">{narrative.riskExplanation}</p>
                 </div>
               )}
               {narrative.expectedOutcomes && (
                 <div className="mb-4">
                   <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expected Outcomes</h4>
                   <p className="text-sm">{narrative.expectedOutcomes}</p>
                 </div>
               )}
               {narrative.governanceRules && (
                 <div className="mb-4">
                   <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Governance</h4>
                   <p className="text-sm">{narrative.governanceRules}</p>
                 </div>
               )}
               
               {!narrative.executiveSummary && !narrative.allocationRationale && (
                 <div className="text-center py-8 text-muted-foreground">
                   <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>Click "Auto-Generate" to create a narrative based on your portfolio data.</p>
                 </div>
               )}
             </CardContent>
             
             {(narrative.executiveSummary || narrative.allocationRationale) && (
               <>
                 <Separator />
                 <CardContent className="pt-4">
                   <div className="flex gap-2">
                     <Button variant="outline" className="flex-1 gap-2">
                       <FileText className="h-4 w-4" />
                       Export PDF
                     </Button>
                     <Button className="flex-1 gap-2">
                       <Send className="h-4 w-4" />
                       Send for Review
                     </Button>
                   </div>
                 </CardContent>
               </>
             )}
           </Card>
         </div>
       </div>
     </div>
   );
 }