 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { Slider } from '@/components/ui/slider';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 import { Save, AlertTriangle, Target, Clock, DollarSign, Shield } from 'lucide-react';
 import { useWorkspaceConstraints } from '@/hooks/useWorkspaceConstraints';
 import type { WorkspaceConstraints } from '@/types/workspaces';
 
 interface ConstraintsStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 export function ConstraintsStage({ workspaceId, onComplete }: ConstraintsStageProps) {
   const { constraints, isLoading, saveConstraints } = useWorkspaceConstraints(workspaceId);
   
   const [form, setForm] = useState<Partial<WorkspaceConstraints>>({});
   
   useEffect(() => {
     if (constraints) {
       setForm(constraints);
     }
   }, [constraints]);
   
   const handleSave = async () => {
     await saveConstraints.mutateAsync(form);
     onComplete();
   };
   
   const updateField = <K extends keyof WorkspaceConstraints>(field: K, value: WorkspaceConstraints[K]) => {
     setForm(prev => ({ ...prev, [field]: value }));
   };
   
   if (isLoading) {
     return <div className="p-8 text-center text-muted-foreground">Loading constraints...</div>;
   }
 
   return (
     <div className="space-y-6 p-6 max-w-4xl">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Client Constraints</h2>
           <p className="text-muted-foreground mt-1">
             Define what is allowed, not what is optimal. These constraints gate all downstream engines.
           </p>
         </div>
         <Button onClick={handleSave} disabled={saveConstraints.isPending}>
           <Save className="h-4 w-4 mr-2" />
           Save & Continue
         </Button>
       </div>
 
       {/* Target Metrics */}
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center gap-2">
             <Target className="h-5 w-5 text-primary" />
             <CardTitle className="text-lg">Target Metrics</CardTitle>
           </div>
           <CardDescription>Define the client's return objectives and risk tolerance</CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-2 gap-6">
           <div className="space-y-2">
             <Label>Target Return (Nominal) %</Label>
             <Input
               type="number"
               step="0.1"
               value={form.target_return_nominal ?? ''}
               onChange={(e) => updateField('target_return_nominal', parseFloat(e.target.value) || undefined)}
               placeholder="e.g., 7.0"
             />
           </div>
           <div className="space-y-2">
             <Label>Target Return (Real) %</Label>
             <Input
               type="number"
               step="0.1"
               value={form.target_return_real ?? ''}
               onChange={(e) => updateField('target_return_real', parseFloat(e.target.value) || undefined)}
               placeholder="e.g., 5.0"
             />
           </div>
           <div className="space-y-2">
             <Label>Maximum Drawdown %</Label>
             <div className="flex items-center gap-4">
               <Slider
                 value={[form.max_drawdown ?? 20]}
                 onValueChange={([v]) => updateField('max_drawdown', v)}
                 max={50}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.max_drawdown ?? 20}%
               </span>
             </div>
           </div>
           <div className="space-y-2">
             <Label>Investment Horizon (Years)</Label>
             <Input
               type="number"
               value={form.investment_horizon_years ?? ''}
               onChange={(e) => updateField('investment_horizon_years', parseInt(e.target.value) || undefined)}
               placeholder="e.g., 10"
             />
           </div>
         </CardContent>
       </Card>
 
       {/* Concentration Limits */}
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center gap-2">
             <AlertTriangle className="h-5 w-5 text-orange-400" />
             <CardTitle className="text-lg">Concentration Limits</CardTitle>
           </div>
           <CardDescription>Maximum allowed exposure to any single position or segment</CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-3 gap-6">
           <div className="space-y-3">
             <Label>Max Single Asset</Label>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.max_single_asset_pct ?? 20]}
                 onValueChange={([v]) => updateField('max_single_asset_pct', v)}
                 max={100}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.max_single_asset_pct ?? 20}%
               </span>
             </div>
           </div>
           <div className="space-y-3">
             <Label>Max Single Geography</Label>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.max_single_geography_pct ?? 40]}
                 onValueChange={([v]) => updateField('max_single_geography_pct', v)}
                 max={100}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.max_single_geography_pct ?? 40}%
               </span>
             </div>
           </div>
           <div className="space-y-3">
             <Label>Max Single Strategy</Label>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.max_single_strategy_pct ?? 30]}
                 onValueChange={([v]) => updateField('max_single_strategy_pct', v)}
                 max={100}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.max_single_strategy_pct ?? 30}%
               </span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Liquidity Requirements */}
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center gap-2">
             <Clock className="h-5 w-5 text-blue-400" />
             <CardTitle className="text-lg">Liquidity Requirements</CardTitle>
           </div>
           <CardDescription>Minimum allocation to each liquidity bucket</CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-3 gap-6">
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Label>T+0 (Immediate)</Label>
               <Badge variant="outline" className="text-xs">Hard</Badge>
             </div>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.liquidity_t0_min_pct ?? 5]}
                 onValueChange={([v]) => updateField('liquidity_t0_min_pct', v)}
                 max={50}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.liquidity_t0_min_pct ?? 5}%
               </span>
             </div>
           </div>
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Label>T+30 (Monthly)</Label>
               <Badge variant="outline" className="text-xs">Soft</Badge>
             </div>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.liquidity_t30_min_pct ?? 15]}
                 onValueChange={([v]) => updateField('liquidity_t30_min_pct', v)}
                 max={80}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.liquidity_t30_min_pct ?? 15}%
               </span>
             </div>
           </div>
           <div className="space-y-3">
             <div className="flex items-center gap-2">
               <Label>T+90 (Quarterly)</Label>
               <Badge variant="outline" className="text-xs">Soft</Badge>
             </div>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.liquidity_t90_min_pct ?? 30]}
                 onValueChange={([v]) => updateField('liquidity_t90_min_pct', v)}
                 max={100}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.liquidity_t90_min_pct ?? 30}%
               </span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Currency Constraints */}
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center gap-2">
             <DollarSign className="h-5 w-5 text-green-400" />
             <CardTitle className="text-lg">Currency Constraints</CardTitle>
           </div>
         </CardHeader>
         <CardContent className="grid grid-cols-2 gap-6">
           <div className="space-y-2">
             <Label>Base Currency</Label>
             <Input
               value={form.base_currency ?? 'USD'}
               onChange={(e) => updateField('base_currency', e.target.value)}
               placeholder="USD"
             />
           </div>
           <div className="space-y-3">
             <Label>Max FX Exposure</Label>
             <div className="flex items-center gap-3">
               <Slider
                 value={[form.max_fx_exposure_pct ?? 30]}
                 onValueChange={([v]) => updateField('max_fx_exposure_pct', v)}
                 max={100}
                 step={1}
                 className="flex-1"
               />
               <span className="w-12 text-right font-mono text-sm">
                 {form.max_fx_exposure_pct ?? 30}%
               </span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Special Constraints */}
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center gap-2">
             <Shield className="h-5 w-5 text-purple-400" />
             <CardTitle className="text-lg">Special Constraints & Exclusions</CardTitle>
           </div>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <Label>ESG Exclusions (comma-separated)</Label>
             <Input
               value={(form.esg_exclusions ?? []).join(', ')}
               onChange={(e) => updateField('esg_exclusions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
               placeholder="e.g., Tobacco, Weapons, Gambling"
             />
           </div>
           <div className="space-y-2">
             <Label>Additional Constraints (Free text)</Label>
             <Textarea
               value={form.special_constraints ?? ''}
               onChange={(e) => updateField('special_constraints', e.target.value)}
               placeholder="Any regulatory, legal, or client-specific constraints..."
               rows={4}
             />
           </div>
         </CardContent>
       </Card>
 
       <Separator />
 
       <div className="flex justify-end">
         <Button onClick={handleSave} size="lg" disabled={saveConstraints.isPending}>
           <Save className="h-4 w-4 mr-2" />
           Save Constraints & Continue
         </Button>
       </div>
     </div>
   );
 }