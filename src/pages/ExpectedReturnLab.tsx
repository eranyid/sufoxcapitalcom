 import { useState, useMemo, useCallback } from 'react';
 import { Helmet } from 'react-helmet-async';
 import { 
   FlaskConical, 
   Play, 
   AlertTriangle,
   Info,
   RefreshCw
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { InputAssumptionsTable } from '@/components/expectedReturnLab/InputAssumptionsTable';
 import { LabParametersPanel } from '@/components/expectedReturnLab/LabParametersPanel';
 import { ExpectedReturnMetrics } from '@/components/expectedReturnLab/ExpectedReturnMetrics';
 import { OptimizationResultsTable } from '@/components/expectedReturnLab/OptimizationResultsTable';
 import { AllocationComparisonChart } from '@/components/expectedReturnLab/AllocationComparisonChart';
 import { EfficientFrontierChart } from '@/components/expectedReturnLab/EfficientFrontierChart';
 import { RiskContributionPie } from '@/components/expectedReturnLab/RiskContributionPie';
 import { ReturnComparisonChart } from '@/components/expectedReturnLab/ReturnComparisonChart';
 import { 
   AssetAssumption, 
   LabParameters, 
   OptimizationResult,
   PortfolioMetrics,
   DEFAULT_ASSET_CLASSES, 
   DEFAULT_PARAMETERS 
 } from '@/types/expectedReturnLab';
 import { runBlackLittermanOptimization } from '@/lib/expectedReturnEngine';
 
 export default function ExpectedReturnLab() {
   // Initialize assets with IDs
   const [assets, setAssets] = useState<AssetAssumption[]>(() => 
     DEFAULT_ASSET_CLASSES.map(a => ({ ...a, id: crypto.randomUUID() }))
   );
   const [params, setParams] = useState<LabParameters>(DEFAULT_PARAMETERS);
   const [results, setResults] = useState<OptimizationResult[]>([]);
   const [inputMetrics, setInputMetrics] = useState<PortfolioMetrics | null>(null);
   const [optimizedMetrics, setOptimizedMetrics] = useState<PortfolioMetrics | null>(null);
   const [isCalculating, setIsCalculating] = useState(false);
   const [hasRun, setHasRun] = useState(false);
   
    // Validation - only check for minimum assets
    const hasEnoughAssets = assets.length >= 2;
    const canOptimize = hasEnoughAssets;
    
    // Run optimization
    const handleOptimize = useCallback(() => {
      if (!canOptimize) return;
      
      setIsCalculating(true);
      
      // Use setTimeout to allow UI to update
      setTimeout(() => {
        try {
          const { results: optResults, metrics } = runBlackLittermanOptimization(assets, params);
          setResults(optResults);
          setInputMetrics(metrics.input);
          setOptimizedMetrics(metrics.optimized);
          setHasRun(true);
        } catch (error) {
          console.error('Optimization failed:', error);
        } finally {
          setIsCalculating(false);
        }
      }, 50);
    }, [assets, params, canOptimize]);
   
   return (
     <>
       <Helmet>
         <title>Expected Return Lab | SUFOX Capital</title>
         <meta name="description" content="Forward-looking portfolio optimization using Black-Litterman model" />
       </Helmet>
       
       <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-primary/10">
               <FlaskConical className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h1 className="text-xl font-semibold text-foreground">Expected Return & Optimization Lab</h1>
               <p className="text-xs text-muted-foreground mt-0.5">
                 Forward-looking allocation modeling using Black-Litterman framework
               </p>
             </div>
           </div>
           
           <Button
             onClick={handleOptimize}
             disabled={!canOptimize || isCalculating}
             size="lg"
             className="gap-2"
           >
             {isCalculating ? (
               <>
                 <RefreshCw className="h-4 w-4 animate-spin" />
                 Computing...
               </>
             ) : (
               <>
                 <Play className="h-4 w-4" />
                 Run Optimization
               </>
             )}
           </Button>
         </div>
         
          {/* Validation Warnings */}
          {!hasEnoughAssets && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Add at least 2 asset classes to run optimization.
              </AlertDescription>
            </Alert>
          )}
         
         {/* SECTION 1: Input Assumptions */}
         <InputAssumptionsTable assets={assets} onAssetsChange={setAssets} />
         
         {/* Parameters + Metrics Row */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           {/* SECTION 2: Parameters */}
           <div className="lg:col-span-4">
             <LabParametersPanel params={params} onParamsChange={setParams} />
           </div>
           
           {/* SECTION 3: Expected Return Metrics */}
           <div className="lg:col-span-8">
             <ExpectedReturnMetrics 
               inputMetrics={inputMetrics}
               optimizedMetrics={optimizedMetrics}
               riskFreeRate={params.riskFreeRate}
             />
           </div>
         </div>
         
         {/* SECTION 4: Results */}
         {hasRun && (
           <>
             {/* Results Table */}
             <OptimizationResultsTable results={results} />
             
             {/* Charts Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <AllocationComparisonChart results={results} />
               <EfficientFrontierChart 
                 assets={assets}
                 params={params}
                 inputMetrics={inputMetrics}
                 optimizedMetrics={optimizedMetrics}
               />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <ReturnComparisonChart results={results} />
               <RiskContributionPie results={results} />
             </div>
           </>
         )}
         
         {/* Model Disclaimer */}
         <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
           <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
           <div className="text-xs text-muted-foreground space-y-1">
             <p className="font-medium text-foreground/80">Model Disclaimer</p>
             <p>
               All outputs are model-based, forward-looking estimates. Results are highly sensitive to 
               input assumptions (expected returns, volatilities, correlations) and are not guarantees 
               of future performance. This tool is for analytical purposes only and does not constitute 
               investment advice.
             </p>
           </div>
         </div>
       </div>
     </>
   );
 }