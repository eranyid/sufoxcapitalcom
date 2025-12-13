import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CrmCompany, CompanyStatus, Priority } from '@/types/crm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useCrmCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('crm_companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load companies');
      console.error(error);
    } else {
      setCompanies((data as CrmCompany[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (company: Partial<CrmCompany>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        company_name: company.company_name,
        sector: company.sector || null,
        geography: company.geography || null,
        investment_thesis: company.investment_thesis || null,
        status: company.status || 'research',
        priority: company.priority || 'medium',
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
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete company');
      console.error(error);
      return false;
    }

    setCompanies(prev => prev.filter(c => c.id !== id));
    toast.success('Company deleted');
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
