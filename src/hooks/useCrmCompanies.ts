import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmCompany } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
 import { useSession } from '@/context/SessionContext';
import { toast } from 'sonner';

export function useCrmCompanies() {
  const { user } = useAuth();
   const { session, isContextSet } = useSession();
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);

   // Get client_id for queries
   const activeClientId = session.scope === 'client' ? session.clientId : null;
 
  const fetchCompanies = useCallback(async () => {
     if (!user || !isContextSet) return;
    
    setLoading(true);
     let query = supabase
      .from('crm_companies')
      .select('*')
       .eq('user_id', user.id)
       .is('deleted_at', null);
 
     // Filter by client context
     if (activeClientId) {
       query = query.eq('client_id', activeClientId);
     } else {
       query = query.is('client_id', null);
     }
 
     const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load companies');
      console.error(error);
    } else {
      setCompanies((data as CrmCompany[]) || []);
    }
    setLoading(false);
   }, [user, isContextSet, activeClientId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (company: Partial<CrmCompany>) => {
     if (!user || !isContextSet) return null;

    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
         client_id: activeClientId,
        company_name: company.company_name,
        market_cap: company.market_cap || null,
        sector: company.sector || null,
        geography: company.geography || null,
        investment_thesis: company.investment_thesis || null,
        status: company.status || 'working_on_it',
        notes: company.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create company');
      console.error(error);
      return null;
    }

    setCompanies(prev => [data as CrmCompany, ...prev]);
    toast.success('Company added');
    return data as CrmCompany;
  };

  const updateCompany = async (id: string, updates: Partial<CrmCompany>) => {
    const { error } = await supabase
      .from('crm_companies')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update company');
      console.error(error);
      return false;
    }

    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return true;
  };

  const deleteCompany = async (id: string) => {
    const { error } = await supabase
      .from('crm_companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete company');
      console.error(error);
      return false;
    }

    setCompanies(prev => prev.filter(c => c.id !== id));
    toast.success('Company moved to trash');
    return true;
  };

  return {
    companies,
    loading,
    createCompany,
    updateCompany,
    deleteCompany,
    refetch: fetchCompanies,
  };
}
