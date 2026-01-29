import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFamilyOfficeProfile } from '@/hooks/useFamilyOfficeProfile';
import { WIZARD_STEPS, WizardStep } from '@/types/familyOfficeProfile';
import { ObjectivesHorizonStep } from './familyOffice/ObjectivesHorizonStep';
import { RiskBehaviorStep } from './familyOffice/RiskBehaviorStep';
import { WealthLiquidityStep } from './familyOffice/WealthLiquidityStep';
import { AlternativesCurrencyStep } from './familyOffice/AlternativesCurrencyStep';
import { GovernanceScenariosStep } from './familyOffice/GovernanceScenariosStep';
import { StrategicRecommendationPanel } from './familyOffice/StrategicRecommendationPanel';
import { 
  Target, Shield, Wallet, Layers, Users, 
  ChevronLeft, ChevronRight, Save, CheckCircle2,
  Loader2, Sparkles
} from 'lucide-react';

const stepIcons = {
  objectives: Target,
  risk: Shield,
  wealth: Wallet,
  alternatives: Layers,
  governance: Users,
};

export function FamilyOfficeWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep | 'recommendation'>('objectives');
  const { 
    profile, 
    updateProfile, 
    saveProfile, 
    getRecommendation, 
    getRiskScore,
    isLoading, 
    isSaving,
    hasChanges 
  } = useFamilyOfficeProfile();

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const isLastStep = currentStep === 'governance';
  const isRecommendation = currentStep === 'recommendation';

  const handleNext = () => {
    if (isLastStep) {
      setCurrentStep('recommendation');
    } else if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (isRecommendation) {
      setCurrentStep('governance');
    } else if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSave = async () => {
    await saveProfile();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'objectives':
        return <ObjectivesHorizonStep profile={profile} onUpdate={updateProfile} />;
      case 'risk':
        return <RiskBehaviorStep profile={profile} onUpdate={updateProfile} />;
      case 'wealth':
        return <WealthLiquidityStep profile={profile} onUpdate={updateProfile} />;
      case 'alternatives':
        return <AlternativesCurrencyStep profile={profile} onUpdate={updateProfile} />;
      case 'governance':
        return <GovernanceScenariosStep profile={profile} onUpdate={updateProfile} />;
      case 'recommendation':
        return (
          <StrategicRecommendationPanel 
            recommendation={getRecommendation()} 
            riskScore={getRiskScore()} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      {!isRecommendation && (
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = stepIcons[step.id as keyof typeof stepIcons];
            const isActive = step.id === currentStep;
            const isCompleted = currentStepIndex > index;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary/20 text-primary' 
                      : isCompleted 
                        ? 'text-primary/70' 
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-primary/30' : isCompleted ? 'bg-primary/10' : 'bg-muted/30'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.title}</span>
                </button>
                
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-2 ${
                    isCompleted ? 'bg-primary/50' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendation Header */}
      {isRecommendation && (
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <Badge className="bg-primary/20 text-primary border-primary/40">
            System Recommendation
          </Badge>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 'objectives'}
            >
              <ChevronLeft size={16} className="mr-1" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {hasChanges() && (
                <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/40">
                  Unsaved changes
                </Badge>
              )}

              {isRecommendation ? (
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save Profile
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {isLastStep ? 'View Recommendation' : 'Continue'}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
