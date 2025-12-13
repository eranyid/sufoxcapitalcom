import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmFund, FundStatus, Priority } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useCrmFunds() {
  const { user } = useAuth();
  const [funds, setFunds] = useState<CrmFund[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFunds = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('crm_funds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load funds');
      console.error(error);
    } else {
      setFunds((data as CrmFund[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const createFund = async (fund: Partial<CrmFund>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('crm_funds')
      .insert({
        user_id: user.id,
        fund_name: fund.fund_name,
        strategy: fund.strategy || null,
        asset_class: fund.asset_class || null,
        geography: fund.geography || null,
        manager: fund.manager || null,
        status: fund.status || 'screening',
        priority: fund.priority || 'medium',
        notes: fund.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create fund');
      console.error(error);
      return null;
    }

    setFunds(prev => [data as CrmFund, ...prev]);
    toast.success('Fund added');
    return data as CrmFund;
  };

  const updateFund = async (id: string, updates: Partial<CrmFund>) => {
    const { error } = await supabase
      .from('crm_funds')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update fund');
      console.error(error);
      return false;
    }

    setFunds(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    return true;
  };

  const deleteFund = async (id: string) => {
    const { error } = await supabase
      .from('crm_funds')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete fund');
      console.error(error);
      return false;
    }

    setFunds(prev => prev.filter(f => f.id !== id));
    toast.success('Fund deleted');
    return true;
  };

  return {
    funds,
    loading,
    createFund,
    updateFund,
    deleteFund,
    refetch: fetchFunds,
  };
}
