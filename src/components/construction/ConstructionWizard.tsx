import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { WizardData, DEFAULT_WIZARD_DATA, GeographyAllocation, AssetClassAllocation, TargetConstraints, ObjectiveType, RiskLevel, HorizonType, BucketConfig } from '@/types/construction';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { ObjectiveStep } from './steps/ObjectiveStep';
import { GeographyStep } from './steps/GeographyStep';
import { AssetClassStep } from './steps/AssetClassStep';
import { BucketsStep } from './steps/BucketsStep';
import { ReviewStep } from './steps/ReviewStep';

const STEPS = [
  { id: 1, title: 'Objective & Constraints' },
  { id: 2, title: 'Geography Allocation' },
  { id: 3, title: 'Asset Classes' },
  { id: 4, title: 'Implementation Buckets' },
  { id: 5, title: 'Review & Save' },
];

export function ConstructionWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(DEFAULT_WIZARD_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { saveTarget } = useTargetAllocation();

  const progress = (currentStep / STEPS.length) * 100;

  const updateObjective = (value: ObjectiveType) => {
    setWizardData(prev => ({ ...prev, objective: value }));
  };

  const updateRiskLevel = (value: RiskLevel) => {
    setWizardData(prev => ({ ...prev, riskLevel: value }));
  };

  const updateHorizon = (value: HorizonType) => {
    setWizardData(prev => ({ ...prev, horizon: value }));
  };

  const updateConstraints = (value: TargetConstraints) => {
    setWizardData(prev => ({ ...prev, constraints: value }));
  };

  const updateGeography = (value: GeographyAllocation) => {
    setWizardData(prev => ({ ...prev, geography: value }));
  };

  const updateAssetClasses = (value: AssetClassAllocation) => {
    setWizardData(prev => ({ ...prev, assetClasses: value }));
  };

  const updateBuckets = (value: BucketConfig[]) => {
    setWizardData(prev => ({ ...prev, buckets: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 2: {
        const sum = Object.values(wizardData.geography).reduce((a, b) => a + b, 0);
        return Math.abs(sum - 100) < 0.01;
      }
      case 3: {
        const sum = Object.values(wizardData.assetClasses).reduce((a, b) => a + b, 0);
        return Math.abs(sum - 100) < 0.01;
      }
      case 4: {
        const sum = wizardData.buckets.reduce((a, b) => a + b.targetWeight, 0);
        return Math.abs(sum - 100) < 0.01;
      }
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const id = await saveTarget(wizardData);
      if (id) {
        setIsSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ObjectiveStep
            data={wizardData}
            onUpdateObjective={updateObjective}
            onUpdateRiskLevel={updateRiskLevel}
            onUpdateConstraints={updateConstraints}
          />
        );
      case 2:
        return (
          <GeographyStep
            geography={wizardData.geography}
            onUpdate={updateGeography}
          />
        );
      case 3:
        return (
          <AssetClassStep
            assetClasses={wizardData.assetClasses}
            constraints={wizardData.constraints}
            onUpdate={updateAssetClasses}
          />
        );
      case 4:
        return (
          <BucketsStep
            buckets={wizardData.buckets}
            onUpdate={updateBuckets}
          />
        );
      case 5:
        return <ReviewStep data={wizardData} isSaved={isSaved} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Futuristic Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={cn(
                  "group flex items-center gap-2 transition-all duration-300",
                  step.id === currentStep && "scale-105",
                  step.id < currentStep && "cursor-pointer",
                  step.id > currentStep && "cursor-not-allowed opacity-50"
                )}
                disabled={step.id > currentStep}
              >
                <div className="relative">
                  {/* Glow effect for active step */}
                  {step.id === currentStep && (
                    <div className="absolute inset-0 bg-primary/40 blur-md animate-pulse" />
                  )}
                  <div
                    className={cn(
                      "relative w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold border-2 transition-all duration-300",
                      step.id === currentStep && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30",
                      step.id < currentStep && "bg-primary/20 text-primary border-primary/40 group-hover:border-primary group-hover:bg-primary/30",
                      step.id > currentStep && "bg-muted/30 border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {step.id < currentStep ? <Check size={14} /> : step.id}
                  </div>
                </div>
                <span className={cn(
                  "hidden md:inline text-xs font-medium transition-colors",
                  step.id === currentStep && "text-primary",
                  step.id < currentStep && "text-muted-foreground group-hover:text-primary",
                  step.id > currentStep && "text-muted-foreground/50"
                )}>
                  {step.title}
                </span>
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "hidden md:block w-8 h-px transition-colors",
                    step.id < currentStep ? "bg-primary/50" : "bg-border"
                  )} />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
              Phase
            </span>
            <span className="text-xs font-mono font-bold text-primary">
              {currentStep}/{STEPS.length}
            </span>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div 
            className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
            style={{ left: `${Math.max(0, progress - 5)}%` }}
          />
        </div>
      </div>

      {/* Step Content with animation container */}
      <div className="min-h-[320px] relative">
        <div className="absolute -inset-4 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative">
          {renderStep()}
        </div>
      </div>

      {/* Futuristic Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === STEPS.length ? (
            <Button
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={cn(
                "gap-2 relative overflow-hidden transition-all",
                isSaved && "bg-primary/20 text-primary border border-primary/30"
              )}
            >
              {/* Button glow effect */}
              {!isSaved && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
              )}
              {isSaved ? (
                <>
                  <Check size={16} />
                  <span className="font-mono">SAVED</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span className="font-mono">{isSaving ? 'SAVING...' : 'DEPLOY TARGET'}</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="font-mono">NEXT</span>
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {!canProceed() && currentStep >= 2 && currentStep <= 4 && (
        <div className="flex items-center justify-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <p className="text-xs text-destructive font-mono">
            VALIDATION ERROR: Allocations must sum to 100%
          </p>
        </div>
      )}
    </div>
  );
}