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
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium transition-colors",
                  step.id === currentStep && "text-primary",
                  step.id < currentStep && "text-muted-foreground hover:text-primary cursor-pointer",
                  step.id > currentStep && "text-muted-foreground/50 cursor-not-allowed"
                )}
                disabled={step.id > currentStep}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                    step.id === currentStep && "bg-primary text-primary-foreground border-primary",
                    step.id < currentStep && "bg-primary/20 text-primary border-primary/40",
                    step.id > currentStep && "bg-muted border-muted-foreground/30"
                  )}
                >
                  {step.id < currentStep ? <Check size={12} /> : step.id}
                </div>
                <span className="hidden md:inline">{step.title}</span>
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft size={16} />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === STEPS.length ? (
            <Button
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className="gap-2"
            >
              {isSaved ? (
                <>
                  <Check size={16} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save as Target Allocation'}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {!canProceed() && currentStep >= 2 && currentStep <= 4 && (
        <p className="text-xs text-destructive text-center">
          Allocations must sum to 100%
        </p>
      )}
    </div>
  );
}
