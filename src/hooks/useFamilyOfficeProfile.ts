import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { 
  FamilyOfficeProfile, 
  StrategicRecommendation,
  defaultFamilyOfficeProfile,
  generateRecommendation,
  calculateRiskScore 
} from '@/types/familyOfficeProfile';

export function useFamilyOfficeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FamilyOfficeProfile>(defaultFamilyOfficeProfile);
  const [savedProfile, setSavedProfile] = useState<FamilyOfficeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('needs_profile')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_type', 'family_office')
        .maybeSingle();

      if (error) throw error;

      if (data?.answers_json) {
        const loadedProfile = data.answers_json as unknown as FamilyOfficeProfile;
        setProfile(loadedProfile);
        setSavedProfile(loadedProfile);
      }
    } catch (error) {
      console.error('Error fetching family office profile:', error);
      toast.error('Failed to load Family Office profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      const riskScore = calculateRiskScore(profile);
      const recommendation = generateRecommendation(profile);

      // Check if profile exists
      const { data: existing } = await supabase
        .from('needs_profile')
        .select('id')
        .eq('user_id', user.id)
        .eq('profile_type', 'family_office')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('needs_profile')
          .update({
            answers_json: JSON.parse(JSON.stringify(profile)) as Json,
            risk_score: riskScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('needs_profile')
          .insert([{
            user_id: user.id,
            profile_type: 'family_office',
            answers_json: JSON.parse(JSON.stringify(profile)) as Json,
            risk_score: riskScore,
          }]);

        if (error) throw error;
      }

      setSavedProfile(profile);
      toast.success('Family Office profile saved successfully');
      return recommendation;
    } catch (error) {
      console.error('Error saving family office profile:', error);
      toast.error('Failed to save profile');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = <K extends keyof FamilyOfficeProfile>(
    section: K,
    data: Partial<FamilyOfficeProfile[K]>
  ) => {
    setProfile(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const getRecommendation = (): StrategicRecommendation => {
    return generateRecommendation(profile);
  };

  const getRiskScore = (): number => {
    return calculateRiskScore(profile);
  };

  const hasChanges = (): boolean => {
    if (!savedProfile) return true;
    return JSON.stringify(profile) !== JSON.stringify(savedProfile);
  };

  return {
    profile,
    setProfile,
    updateProfile,
    saveProfile,
    getRecommendation,
    getRiskScore,
    isLoading,
    isSaving,
    hasChanges,
    savedProfile,
  };
}
