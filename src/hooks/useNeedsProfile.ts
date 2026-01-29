import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import {
  NeedsAnswers,
  NeedsProfile,
  SystemRecommendation,
  DEFAULT_NEEDS_ANSWERS,
  calculateRiskScore,
  getRiskProfile,
  generateRecommendation,
  RiskProfileType,
} from '@/types/needsProfile';

export function useNeedsProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<NeedsProfile | null>(null);
  const [answers, setAnswers] = useState<NeedsAnswers>(DEFAULT_NEEDS_ANSWERS);
  const [recommendation, setRecommendation] = useState<SystemRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing profile
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('needs_profile')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data as unknown as NeedsProfile);
          const savedAnswers = data.answers_json as unknown as NeedsAnswers;
          setAnswers(savedAnswers);
          setRecommendation(generateRecommendation(savedAnswers));
        }
      } catch (error) {
        console.error('Error fetching needs profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Update answers and recalculate recommendation
  const updateAnswers = (newAnswers: Partial<NeedsAnswers>) => {
    const updated = { ...answers, ...newAnswers };
    setAnswers(updated);
    setRecommendation(generateRecommendation(updated));
  };

  // Save profile to database
  const saveProfile = async (): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Please sign in to save your profile');
      return null;
    }

    setIsSaving(true);
    try {
      const riskScore = calculateRiskScore(answers);
      const profileType = getRiskProfile(riskScore);

      if (profile?.id) {
        // Update existing
        const { error } = await supabase
          .from('needs_profile')
          .update({
            answers_json: answers as unknown as Json,
            risk_score: riskScore,
            profile_type: profileType,
          })
          .eq('id', profile.id);

        if (error) throw error;
        toast.success('Needs profile updated');
        return profile.id;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('needs_profile')
          .insert([{
            user_id: user.id,
            answers_json: answers as unknown as Json,
            risk_score: riskScore,
            profile_type: profileType,
          }])
          .select()
          .single();

        if (error) throw error;
        
        setProfile(data as unknown as NeedsProfile);
        toast.success('Needs profile saved');
        return data.id;
      }
    } catch (error) {
      console.error('Error saving needs profile:', error);
      toast.error('Failed to save needs profile');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Generate wizard defaults based on recommendation
  const getWizardDefaults = () => {
    if (!recommendation) return null;

    const midpoint = (range: { min: number; max: number }) => 
      Math.round((range.min + range.max) / 2);

    return {
      objective: recommendation.riskProfile === 'conservative' 
        ? 'absolute_return' 
        : recommendation.riskProfile === 'aggressive' 
          ? 'aggressive' 
          : recommendation.riskProfile === 'growth' 
            ? 'growth' 
            : 'balanced',
      riskLevel: recommendation.riskProfile === 'conservative' 
        ? 'low' 
        : recommendation.riskProfile === 'aggressive' 
          ? 'high' 
          : 'medium',
      geography: {
        israel: midpoint(recommendation.geographyTilt.israel),
        usa: midpoint(recommendation.geographyTilt.usa),
        europe: midpoint(recommendation.geographyTilt.europe),
        other: midpoint(recommendation.geographyTilt.other),
      },
      assetClasses: {
        equities: midpoint(recommendation.equityRange),
        bonds: midpoint(recommendation.bondsRange),
        hedging: midpoint(recommendation.hedgingRange),
        alternatives: midpoint(recommendation.alternativesRange),
        cash: midpoint(recommendation.cashRange),
      },
    };
  };

  return {
    profile,
    answers,
    recommendation,
    isLoading,
    isSaving,
    updateAnswers,
    saveProfile,
    getWizardDefaults,
    hasProfile: !!profile,
  };
}
