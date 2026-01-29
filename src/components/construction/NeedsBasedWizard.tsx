import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Save, Check, Brain, Cpu, Target, Layers } from 'lucide-react';
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
import { NeedsAnswers, DEFAULT_NEEDS_ANSWERS, SystemRecommendation, generateRecommendation } from '@/types/needsProfile';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { useNeedsProfile } from '@/hooks/useNeedsProfile';
import { NeedsProfilingStep } from './NeedsProfilingStep';
import { SystemRecommendationPanel } from './SystemRecommendation';
import { ObjectiveStep } from './steps/ObjectiveStep';
import { GeographyStep } from './steps/GeographyStep';
import { AssetClassStep } from './steps/AssetClassStep';
import { AlternativesStep } from './steps/AlternativesStep';
import { BucketsStep } from './steps/BucketsStep';
import { ReviewStep } from './steps/ReviewStep';

// Phase structure
const PHASES = [
  { 
    id: 1, 
    title: 'Needs Profiling', 
    icon: Brain,
    description: 'Define your investment needs',
    sections: 5 // 5 sections within needs profiling
  },
  { 
    id: 2, 
    title: 'System Recommendation', 
    icon: Cpu,
    description: 'AI-powered strategy analysis',
    sections: 1
  },
  { 
    id: 3, 
    title: 'Target Allocation', 
    icon: Target,
    description: 'Build your portfolio',
    sections: 6 // 6 steps in target allocation
  },
];

const NEEDS_SECTIONS = [
  { id: 1, title: 'Purpose' },
  { id: 2, title: 'Behavioral Risk' },
  { id: 3, title: 'Financial Stability' },
  { id: 4, title: 'Time Horizon' },
  { id: 5, title: 'Preferences' },
];

const TARGET_STEPS = [
  { id: 1, title: 'Objective & Constraints' },
  { id: 2, title: 'Geography Allocation' },
  { id: 3, title: 'Asset Classes' },
  { id: 4, title: 'Alternative Investments' },
  { id: 5, title: 'Implementation Buckets' },
  { id: 6, title: 'Review & Save' },
];

export function NeedsBasedWizard() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [needsSection, setNeedsSection] = useState(1);
  const [targetStep, setTargetStep] = useState(1);
  
  const { 
    answers, 
    recommendation, 
    updateAnswers, 
    saveProfile, 
    getWizardDefaults,
    hasProfile,
    isLoading: profileLoading 
  } = useNeedsProfile();
  
  const [wizardData, setWizardData] = useState<WizardData>(DEFAULT_WIZARD_DATA);
  const [adjustedFromRecommendation, setAdjustedFromRecommendation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { saveTarget } = useTargetAllocation();

  // Apply recommendation defaults when entering phase 3
  const applyRecommendationDefaults = () => {
    const defaults = getWizardDefaults();
    if (defaults) {
      setWizardData(prev => ({
        ...prev,
        objective: defaults.objective as ObjectiveType,
        riskLevel: defaults.riskLevel as RiskLevel,
        geography: defaults.geography,
        assetClasses: defaults.assetClasses,
      }));
    }
  };

  // Phase navigation
  const handleContinueToPhase2 = async () => {
    await saveProfile();
    setCurrentPhase(2);
  };

  const handleContinueToPhase3 = () => {
    applyRecommendationDefaults();
    setCurrentPhase(3);
  };

  // Needs section navigation
  const handleNextNeedsSection = () => {
    if (needsSection < 5) {
      setNeedsSection(prev => prev + 1);
    } else {
      handleContinueToPhase2();
    }
  };

  const handlePrevNeedsSection = () => {
    if (needsSection > 1) {
      setNeedsSection(prev => prev - 1);
    }
  };

  // Target step navigation
  const handleNextTargetStep = () => {
    if (targetStep < 6) {
      setTargetStep(prev => prev + 1);
    }
  };

  const handlePrevTargetStep = () => {
    if (targetStep > 1) {
      setTargetStep(prev => prev - 1);
    } else {
      setCurrentPhase(2);
    }
  };

  // Wizard data updates
  const updateObjective = (value: ObjectiveType) => {
    setWizardData(prev => ({ ...prev, objective: value }));
    setAdjustedFromRecommendation(true);
  };

  const updateRiskLevel = (value: RiskLevel) => {
    setWizardData(prev => ({ ...prev, riskLevel: value }));
    setAdjustedFromRecommendation(true);
  };

  const updateConstraints = (value: TargetConstraints) => {
    setWizardData(prev => ({ ...prev, constraints: value }));
  };

  const updateGeography = (value: GeographyAllocation) => {
    setWizardData(prev => ({ ...prev, geography: value }));
    setAdjustedFromRecommendation(true);
  };

  const updateAssetClasses = (value: AssetClassAllocation) => {
    setWizardData(prev => ({ ...prev, assetClasses: value }));
    setAdjustedFromRecommendation(true);
  };

  const updateBuckets = (value: BucketConfig[]) => {
    setWizardData(prev => ({ ...prev, buckets: value }));
  };

  const updateAlternatives = (value: AlternativesAllocation) => {
    setWizardData(prev => ({ ...prev, alternatives: value }));
  };

  const updateAlternativeConfigs = (value: AlternativeConfig[]) => {
    setWizardData(prev => ({ ...prev, alternativeConfigs: value }));
  };

  const canProceedTarget = (): boolean => {
    switch (targetStep) {
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

  // Render current content
  const renderContent = () => {
    if (currentPhase === 1) {
      return (
        <NeedsProfilingStep 
          answers={answers}
          onUpdate={updateAnswers}
          currentSection={needsSection}
        />
      );
    }
    
    if (currentPhase === 2) {
      if (!recommendation) return null;
      return (
        <SystemRecommendationPanel 
          recommendation={recommendation}
          onContinue={handleContinueToPhase3}
        />
      );
    }

    // Phase 3 - Target Allocation
    switch (targetStep) {
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
          <AlternativesStep
            alternatives={wizardData.alternatives}
            configs={wizardData.alternativeConfigs}
            onUpdateAlternatives={updateAlternatives}
            onUpdateConfigs={updateAlternativeConfigs}
          />
        );
      case 5:
        return (
          <BucketsStep
            buckets={wizardData.buckets}
            onUpdate={updateBuckets}
          />
        );
      case 6:
        return <ReviewStep data={wizardData} isSaved={isSaved} />;
      default:
        return null;
    }
  };

  // Calculate overall progress
  const getProgress = () => {
    if (currentPhase === 1) {
      return ((needsSection - 1) / 12) * 100 + (100 / 12);
    }
    if (currentPhase === 2) {
      return ((5 / 12) * 100) + (100 / 12);
    }
    return ((6 / 12) * 100) + ((targetStep / 12) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Phase Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            {PHASES.map((phase, index) => {
              const Icon = phase.icon;
              const isActive = phase.id === currentPhase;
              const isComplete = phase.id < currentPhase;
              
              return (
                <button
                  key={phase.id}
                  onClick={() => phase.id < currentPhase && setCurrentPhase(phase.id)}
                  className={cn(
                    "group flex items-center gap-2 transition-all duration-300",
                    isActive && "scale-105",
                    isComplete && "cursor-pointer",
                    !isActive && !isComplete && "cursor-not-allowed opacity-50"
                  )}
                  disabled={phase.id > currentPhase}
                >
                  <div className="relative">
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/40 blur-md animate-pulse" />
                    )}
                    <div
                      className={cn(
                        "relative w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
                        isActive && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30",
                        isComplete && "bg-primary/20 text-primary border-primary/40",
                        !isActive && !isComplete && "bg-muted/30 border-muted-foreground/30 text-muted-foreground/50"
                      )}
                    >
                      {isComplete ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className={cn(
                      "text-xs font-medium transition-colors block",
                      isActive && "text-primary",
                      isComplete && "text-muted-foreground",
                      !isActive && !isComplete && "text-muted-foreground/50"
                    )}>
                      {phase.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {phase.description}
                    </span>
                  </div>
                  {index < PHASES.length - 1 && (
                    <div className={cn(
                      "hidden md:block w-8 h-px transition-colors",
                      isComplete ? "bg-primary/50" : "bg-border"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Adjustment Badge */}
          {currentPhase === 3 && adjustedFromRecommendation && (
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-[10px]">
              ADJUSTED VS RECOMMENDATION
            </Badge>
          )}
        </div>

        {/* Sub-navigation for Phase 1 */}
        {currentPhase === 1 && (
          <div className="flex items-center gap-2 pl-12">
            {NEEDS_SECTIONS.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => section.id <= needsSection && setNeedsSection(section.id)}
                className={cn(
                  "text-[10px] font-mono px-2 py-1 rounded transition-all",
                  needsSection === section.id && "bg-primary/20 text-primary",
                  section.id < needsSection && "text-muted-foreground hover:text-primary cursor-pointer",
                  section.id > needsSection && "text-muted-foreground/40 cursor-not-allowed"
                )}
                disabled={section.id > needsSection}
              >
                {section.title}
              </button>
            ))}
          </div>
        )}

        {/* Sub-navigation for Phase 3 */}
        {currentPhase === 3 && (
          <div className="flex items-center gap-2 pl-12 flex-wrap">
            {TARGET_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => step.id <= targetStep && setTargetStep(step.id)}
                className={cn(
                  "text-[10px] font-mono px-2 py-1 rounded transition-all",
                  targetStep === step.id && "bg-primary/20 text-primary",
                  step.id < targetStep && "text-muted-foreground hover:text-primary cursor-pointer",
                  step.id > targetStep && "text-muted-foreground/40 cursor-not-allowed"
                )}
                disabled={step.id > targetStep}
              >
                {step.title}
              </button>
            ))}
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div 
            className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px] relative">
        <div className="absolute -inset-4 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative">
          {renderContent()}
        </div>
      </div>

      {/* Navigation (for Phase 1 and Phase 3) */}
      {currentPhase !== 2 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={currentPhase === 1 ? handlePrevNeedsSection : handlePrevTargetStep}
            disabled={currentPhase === 1 && needsSection === 1}
            className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex items-center gap-2">
            {currentPhase === 1 && (
              <Button
                onClick={handleNextNeedsSection}
                className="gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="font-mono">{needsSection === 5 ? 'ANALYZE' : 'NEXT'}</span>
                <ChevronRight size={16} />
              </Button>
            )}

            {currentPhase === 3 && targetStep < 6 && (
              <Button
                onClick={handleNextTargetStep}
                disabled={!canProceedTarget()}
                className="gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="font-mono">NEXT</span>
                <ChevronRight size={16} />
              </Button>
            )}

            {currentPhase === 3 && targetStep === 6 && (
              <Button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={cn(
                  "gap-2 relative overflow-hidden transition-all",
                  isSaved && "bg-primary/20 text-primary border border-primary/30"
                )}
              >
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
            )}
          </div>
        </div>
      )}

      {/* Validation Message */}
      {currentPhase === 3 && !canProceedTarget() && targetStep >= 2 && targetStep <= 5 && (
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
