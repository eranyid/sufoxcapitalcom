import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
 import { useSession } from '@/context/SessionContext';
import { toast } from 'sonner';
import type { Report, ReportSection, ReportBranding } from '@/types/reports';
import { DEFAULT_BRANDING, DEFAULT_SECTIONS } from '@/types/reports';
import type { Json } from '@/integrations/supabase/types';

export function useReports() {
  const { user } = useAuth();
   const { session, isContextSet } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

   // Get client_id for queries
   const activeClientId = session.scope === 'client' ? session.clientId : null;
 
  const fetchReports = useCallback(async () => {
     if (!user || !isContextSet) return;

     let query = supabase
      .from('reports')
      .select('*')
       .eq('user_id', user.id);
 
     // Filter by client context
     if (activeClientId) {
       query = query.eq('client_id', activeClientId);
     } else {
       query = query.is('client_id', null);
     }
 
     const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } else {
      setReports((data || []).map(r => ({
        ...r,
        sections: r.sections as unknown as ReportSection[],
        branding: r.branding as unknown as ReportBranding,
        page_size: r.page_size as 'A4' | 'Letter',
      })));
    }
    setLoading(false);
   }, [user, isContextSet, activeClientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const createReport = async (name: string, description?: string): Promise<Report | null> => {
     if (!user || !isContextSet) return null;

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
         client_id: activeClientId,
        name,
        description: description || null,
        sections: DEFAULT_SECTIONS as unknown as Json,
        branding: DEFAULT_BRANDING as unknown as Json,
        page_size: 'A4',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create report');
      console.error(error);
      return null;
    }

    const newReport: Report = {
      ...data,
      sections: data.sections as unknown as ReportSection[],
      branding: data.branding as unknown as ReportBranding,
      page_size: data.page_size as 'A4' | 'Letter',
    };
    setReports(prev => [newReport, ...prev]);
    toast.success('Report created');
    return newReport;
  };

  const updateReport = async (id: string, updates: Partial<Omit<Report, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.sections !== undefined) dbUpdates.sections = updates.sections as unknown as Json;
    if (updates.branding !== undefined) dbUpdates.branding = updates.branding as unknown as Json;
    if (updates.page_size !== undefined) dbUpdates.page_size = updates.page_size;

    const { error } = await supabase
      .from('reports')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to save report');
      console.error(error);
      return false;
    }

    setReports(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    return true;
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete report');
      console.error(error);
      return false;
    }

    setReports(prev => prev.filter(r => r.id !== id));
    toast.success('Report deleted');
    return true;
  };

  const duplicateReport = async (id: string): Promise<Report | null> => {
    const original = reports.find(r => r.id === id);
     if (!original || !user || !isContextSet) return null;

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
         client_id: activeClientId,
        name: `${original.name} (Copy)`,
        description: original.description,
        sections: original.sections as unknown as Json,
        branding: original.branding as unknown as Json,
        page_size: original.page_size,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to duplicate report');
      console.error(error);
      return null;
    }

    const newReport: Report = {
      ...data,
      sections: data.sections as unknown as ReportSection[],
      branding: data.branding as unknown as ReportBranding,
      page_size: data.page_size as 'A4' | 'Letter',
    };
    setReports(prev => [newReport, ...prev]);
    toast.success('Report duplicated');
    return newReport;
  };

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
    refetch: fetchReports,
  };
}

export function useReport(reportId: string | undefined) {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    if (!user || !reportId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (error) {
      toast.error('Failed to load report');
      console.error(error);
    } else if (data) {
      setReport({
        ...data,
        sections: data.sections as unknown as ReportSection[],
        branding: data.branding as unknown as ReportBranding,
        page_size: data.page_size as 'A4' | 'Letter',
      });
    }
    setLoading(false);
  }, [user, reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const updateReport = async (updates: Partial<Omit<Report, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    if (!reportId) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.sections !== undefined) dbUpdates.sections = updates.sections as unknown as Json;
    if (updates.branding !== undefined) dbUpdates.branding = updates.branding as unknown as Json;
    if (updates.page_size !== undefined) dbUpdates.page_size = updates.page_size;

    const { error } = await supabase
      .from('reports')
      .update(dbUpdates)
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to save report');
      console.error(error);
      return false;
    }

    setReport(prev => (prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null));
    return true;
  };

  return {
    report,
    loading,
    updateReport,
    refetch: fetchReport,
  };
}
