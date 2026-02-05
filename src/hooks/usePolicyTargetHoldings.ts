import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/context/SessionContext';
import { toast } from 'sonner';

export interface PolicyTargetHolding {
  id: string;
  ticker: string;
  name: string | null;
  target_weight: number;
}

export function usePolicyTargetHoldings() {
  const { user } = useAuth();
  const { session, isContextSet } = useSession();
  const [holdings, setHoldings] = useState<PolicyTargetHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = session.scope === 'client' ? session.clientId : null;

  const fetch = useCallback(async () => {
    if (!user?.id || !isContextSet) return;

    try {
      let query = supabase
        .from('policy_target_holdings')
        .select('id, ticker, name, target_weight')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setHoldings((data || []).map(d => ({ ...d, target_weight: Number(d.target_weight) })));
    } catch (err) {
      console.error('Error fetching policy target holdings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isContextSet, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addHolding = async (ticker: string, name: string, weight: number) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('policy_target_holdings')
      .insert({ user_id: user.id, client_id: clientId, ticker, name, target_weight: weight } as any);
    if (error) { toast.error('Failed to add'); return; }
    toast.success('Holding added');
    await fetch();
  };

  const updateHolding = async (id: string, updates: Partial<Pick<PolicyTargetHolding, 'ticker' | 'name' | 'target_weight'>>) => {
    const { error } = await supabase
      .from('policy_target_holdings')
      .update(updates as any)
      .eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    await fetch();
  };

  const removeHolding = async (id: string) => {
    const { error } = await supabase
      .from('policy_target_holdings')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Holding removed');
    await fetch();
  };

  return { holdings, isLoading, addHolding, updateHolding, removeHolding };
}
