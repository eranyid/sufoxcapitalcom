import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Layers, ArrowLeft, ArrowRight, Check, Target, PieChart, 
  BarChart3, Save, ChevronRight, Sparkles
} from 'lucide-react';
import { Position } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

// Pipeline Steps
import { PipelineObjectivesStep } from '@/components/construction/pipeline/PipelineObjectivesStep';
import { PipelinePositionsStep } from '@/components/construction/pipeline/PipelinePositionsStep';
import { PipelineAllocationStep } from '@/components/construction/pipeline/PipelineAllocationStep';
import { PipelineInsightsStep } from '@/components/construction/pipeline/PipelineInsightsStep';
import { PipelineSaveStep } from '@/components/construction/pipeline/PipelineSaveStep';

// Sample data for demo
const SAMPLE_POSITIONS: Position[] = [
  { id: '1', name: 'S&P 500 ETF', assetType: 'equity', allocation: 25, region: 'north_america', country: 'United States', sector: 'Multi-Sector', industry: 'Index', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['growth'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'US Treasury Bonds', assetType: 'fixed_income', allocation: 15, region: 'north_america', country: 'United States', sector: 'Government', industry: 'Treasuries', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['defensive', 'income'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'European Equity Fund', assetType: 'equity', allocation: 12, region: 'europe', country: 'Germany', sector: 'Multi-Sector', industry: 'Index', currency: 'EUR', liquidityBucket: 'liquid', styleTags: ['value'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'Real Estate REIT', assetType: 'real_estate', allocation: 10, region: 'north_america', country: 'United States', sector: 'Real Estate', industry: 'REITs', currency: 'USD', liquidityBucket: 'liquid', styleTags: ['income'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', name: 'Gold ETF', assetType: 'commodities', allocation: 5, region: 'global', country: 'Global/Multi-Country', sector: 'Materials', industry: 'Precious Metals', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['defensive'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', name: 'Private Equity Fund', assetType: 'alternatives', allocation: 8, region: 'north_america', country: 'United States', sector: 'Financials', industry: 'PE', currency: 'USD', liquidityBucket: 'locked', styleTags: ['growth'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', name: 'Japan Equity', assetType: 'equity', allocation: 8, region: 'asia_pacific', country: 'Japan', sector: 'Technology', industry: 'Semiconductors', currency: 'JPY', liquidityBucket: 'liquid', styleTags: ['growth', 'value'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', name: 'Israel Bonds', assetType: 'fixed_income', allocation: 7, region: 'middle_east', country: 'Israel', sector: 'Government', industry: 'Sovereign', currency: 'ILS', liquidityBucket: 'liquid', styleTags: ['income'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '9', name: 'Cash Reserve', assetType: 'cash', allocation: 5, region: 'north_america', country: 'United States', sector: 'Financials', industry: 'Money Market', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['defensive'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '10', name: 'EM Equity', assetType: 'equity', allocation: 5, region: 'asia_pacific', country: 'China', sector: 'Multi-Sector', industry: 'Index', currency: 'USD', liquidityBucket: 'liquid', styleTags: ['growth', 'speculative'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export interface AllocationObjectives {
  name: string;
  objective: 'growth' | 'balanced' | 'income' | 'preservation';
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  horizon: 'short' | 'medium' | 'long';
}

const STEPS = [
  { id: 1, name: 'Objectives', icon: Target, description: 'Define goals & risk' },
  { id: 2, name: 'Positions', icon: Layers, description: 'Build allocation' },
  { id: 3, name: 'Review', icon: PieChart, description: 'Validate weights' },
  { id: 4, name: 'Insights', icon: BarChart3, description: 'Analyze structure' },
  { id: 5, name: 'Save', icon: Save, description: 'Activate target' },
];

export default function AllocationBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [positions, setPositions] = useState<Position[]>(SAMPLE_POSITIONS);
  const [objectives, setObjectives] = useState<AllocationObjectives>({
    name: 'Primary Target Allocation',
    objective: 'balanced',
    riskLevel: 'moderate',
    horizon: 'long',
  });

  const totalAllocation = useMemo(
    () => positions.reduce((sum, p) => sum + p.allocation, 0),
    [positions]
  );

  const isBalanced = Math.abs(totalAllocation - 100) < 0.01;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return objectives.name.trim().length > 0;
      case 2: return positions.length > 0;
      case 3: return isBalanced;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePositionAdd = (newPosition: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => {
    const position: Position = {
      ...newPosition,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPositions(prev => [...prev, position]);
  };

  const handlePositionUpdate = (id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
  };

  const handlePositionDelete = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  const handleLoadSample = () => {
    setPositions(SAMPLE_POSITIONS);
  };

  const handleClear = () => {
    setPositions([]);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PipelineObjectivesStep 
            objectives={objectives} 
            onChange={setObjectives} 
          />
        );
      case 2:
        return (
          <PipelinePositionsStep
            positions={positions}
            totalAllocation={totalAllocation}
            onAdd={handlePositionAdd}
            onUpdate={handlePositionUpdate}
            onDelete={handlePositionDelete}
            onLoadSample={handleLoadSample}
            onClear={handleClear}
          />
        );
      case 3:
        return (
          <PipelineAllocationStep
            positions={positions}
            totalAllocation={totalAllocation}
            isBalanced={isBalanced}
          />
        );
      case 4:
        return (
          <PipelineInsightsStep positions={positions} />
        );
      case 5:
        return (
          <PipelineSaveStep
            objectives={objectives}
            positions={positions}
            totalAllocation={totalAllocation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/construction" 
            className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 transition-all"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <Sparkles className="text-primary" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Allocation Pipeline</h1>
              <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
                STEP {currentStep} OF 5 • {STEPS[currentStep - 1].name.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono">{Math.round((currentStep / 5) * 100)}%</span>
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pipeline Steps Indicator */}
      <Card className="border-border/50 bg-card/50 overflow-hidden">
        <div className="flex">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                disabled={step.id > currentStep + 1}
                className={cn(
                  "flex-1 flex items-center gap-3 px-4 py-3 transition-all relative",
                  "border-r border-border/30 last:border-r-0",
                  isActive && "bg-primary/10",
                  isCompleted && "bg-muted/30",
                  !isActive && !isCompleted && "opacity-50",
                  step.id <= currentStep + 1 && "cursor-pointer hover:bg-muted/20"
                )}
              >
                {/* Step Number/Check */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-emerald-500/20 text-emerald-400",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <Check size={14} /> : step.id}
                </div>
                
                {/* Step Info */}
                <div className="hidden lg:block text-left">
                  <div className={cn(
                    "text-sm font-medium",
                    isActive && "text-primary",
                    isCompleted && "text-emerald-400",
                  )}>
                    {step.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {step.description}
                  </div>
                </div>

                {/* Arrow between steps */}
                {index < STEPS.length - 1 && (
                  <ChevronRight 
                    size={14} 
                    className="absolute right-0 translate-x-1/2 text-muted-foreground/30 z-10 hidden xl:block" 
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {/* Step dots for mobile */}
              <div className="flex items-center gap-1.5 md:hidden">
                {STEPS.map((step) => (
                  <div 
                    key={step.id}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentStep === step.id && "bg-primary w-4",
                      currentStep > step.id && "bg-emerald-500",
                      currentStep < step.id && "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                {currentStep === 3 && !isBalanced ? (
                  'Balance to 100% first'
                ) : (
                  <>
                    Next
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            ) : (
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Save size={16} />
                Activate Allocation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
