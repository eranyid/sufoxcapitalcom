import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  notify_on_assignment: boolean;
  notify_on_status_change: boolean;
  notify_on_urgency_change: boolean;
  notify_on_new_update: boolean;
}

const defaultPreferences: NotificationPreferences = {
  notify_on_assignment: true,
  notify_on_status_change: true,
  notify_on_urgency_change: true,
  notify_on_new_update: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('portfolio_settings')
      .select('notify_on_assignment, notify_on_status_change, notify_on_urgency_change, notify_on_new_update')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      setPreferences({
        notify_on_assignment: data.notify_on_assignment ?? true,
        notify_on_status_change: data.notify_on_status_change ?? true,
        notify_on_urgency_change: data.notify_on_urgency_change ?? true,
        notify_on_new_update: data.notify_on_new_update ?? true,
      });
    }
    setIsLoading(false);
  }, [user?.id]);

  const updatePreference = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.id) return;

    // Check if settings exist
    const { data: existing } = await supabase
      .from('portfolio_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let error;
    if (existing) {
      const result = await supabase
        .from('portfolio_settings')
        .update({ [key]: value })
        .eq('user_id', user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('portfolio_settings')
        .insert({ user_id: user.id, [key]: value });
      error = result.error;
    }

    if (error) {
      console.error('Error updating notification preference:', error);
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      });
      return;
    }

    setPreferences(prev => ({ ...prev, [key]: value }));
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    updatePreference,
    refetch: fetchPreferences,
  };
}
