import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { 
  WizardData, 
  DEFAULT_WIZARD_DATA, 
  GeographyAllocation, 
  AssetClassAllocation, 
  TargetConstraints, 
  ObjectiveType, 
  RiskLevel, 
  HorizonType, 
  BucketConfig,
  AlternativesAllocation,
  AlternativeConfig 
} from '@/types/construction';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { ObjectiveStep } from './steps/ObjectiveStep';
import { GeographyStep } from './steps/GeographyStep';
import { AssetClassStep } from './steps/AssetClassStep';
import { AlternativesStep } from './steps/AlternativesStep';
import { BucketsStep } from './steps/BucketsStep';
import { ReviewStep } from './steps/ReviewStep';

const STEPS = [
  { id: 1, title: 'Objective & Constraints' },
  { id: 2, title: 'Geography' },
  { id: 3, title: 'Asset Classes' },
  { id: 4, title: 'Alternatives' },
  { id: 5, title: 'Buckets' },
  { id: 6, title: 'Review' },
];

interface ConstructionWizardProps {
  initialData?: WizardData;
  onDataChange?: (data: WizardData) => void;
  onSaveComplete?: () => void;
  sandboxMode?: boolean;
}

export function ConstructionWizard({ initialData, onDataChange, onSaveComplete, sandboxMode = false }: ConstructionWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(initialData || DEFAULT_WIZARD_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { saveTarget } = useTargetAllocation();

  const handleSetWizardData = (updater: WizardData | ((prev: WizardData) => WizardData)) => {
    setWizardData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onDataChange?.(next);
      return next;
    });
  };

  const updateObjective = (value: ObjectiveType) => {
    handleSetWizardData(prev => ({ ...prev, objective: value }));
  };
  const updateRiskLevel = (value: RiskLevel) => {
    handleSetWizardData(prev => ({ ...prev, riskLevel: value }));
  };
  const updateHorizon = (value: HorizonType) => {
    handleSetWizardData(prev => ({ ...prev, horizon: value }));
  };
  const updateConstraints = (value: TargetConstraints) => {
    handleSetWizardData(prev => ({ ...prev, constraints: value }));
  };
  const updateGeography = (value: GeographyAllocation) => {
    handleSetWizardData(prev => ({ ...prev, geography: value }));
  };
  const updateAssetClasses = (value: AssetClassAllocation) => {
    handleSetWizardData(prev => ({ ...prev, assetClasses: value }));
  };
  const updateBuckets = (value: BucketConfig[]) => {
    handleSetWizardData(prev => ({ ...prev, buckets: value }));
  };
  const updateAlternatives = (value: AlternativesAllocation) => {
    handleSetWizardData(prev => ({ ...prev, alternatives: value }));
  };
  const updateAlternativeConfigs = (value: AlternativeConfig[]) => {
    handleSetWizardData(prev => ({ ...prev, alternativeConfigs: value }));
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
        const sum = Object.values(wizardData.alternatives).reduce((a, b) => a + b, 0);
        return Math.abs(sum - 100) < 0.01;
      }
      case 5: {
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
        onSaveComplete?.();
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
        return <GeographyStep geography={wizardData.geography} onUpdate={updateGeography} />;
      case 3:
        return <AssetClassStep assetClasses={wizardData.assetClasses} constraints={wizardData.constraints} onUpdate={updateAssetClasses} />;
      case 4:
        return <AlternativesStep alternatives={wizardData.alternatives} configs={wizardData.alternativeConfigs} onUpdateAlternatives={updateAlternatives} onUpdateConfigs={updateAlternativeConfigs} />;
      case 5:
        return <BucketsStep buckets={wizardData.buckets} onUpdate={updateBuckets} />;
      case 6:
        return <ReviewStep data={wizardData} isSaved={isSaved} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Step Navigator — compact pill bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/15 border border-border/30 overflow-x-auto">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all",
                step.id === currentStep && "bg-card border border-primary/30 text-foreground shadow-sm",
                step.id < currentStep && "text-primary/70 hover:bg-muted/20 cursor-pointer",
                step.id > currentStep && "text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0",
                step.id === currentStep && "bg-primary text-primary-foreground",
                step.id < currentStep && "bg-primary/15 text-primary",
                step.id > currentStep && "bg-muted/30 text-muted-foreground/40"
              )}>
                {step.id < currentStep ? <Check size={10} /> : step.id}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
          {currentStep}/{STEPS.length}
        </span>
      </div>

      {/* Progress — thin line */}
      <div className="h-0.5 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/70 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-1.5 text-xs h-8"
        >
          <ChevronLeft size={14} />
          Back
        </Button>

        {currentStep === STEPS.length ? (
          sandboxMode ? (
            <Button
              onClick={() => onSaveComplete?.()}
              className="gap-1.5 text-xs font-mono h-8"
            >
              CONTINUE <ChevronRight size={14} />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={cn("gap-1.5 text-xs font-mono h-8", isSaved && "bg-primary/15 text-primary border border-primary/30")}
            >
              {isSaved ? <><Check size={14} /> SAVED</> : <><Save size={14} /> {isSaving ? 'SAVING...' : 'DEPLOY TARGET'}</>}
            </Button>
          )
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-1.5 text-xs font-mono h-8"
          >
            NEXT <ChevronRight size={14} />
          </Button>
        )}
      </div>

      {/* Validation */}
      {!canProceed() && currentStep >= 2 && currentStep <= 5 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-destructive/8 border border-destructive/20 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          <p className="text-[11px] text-destructive font-mono">
            Allocations must sum to 100%
          </p>
        </div>
      )}
    </div>
  );
}
