import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// Entry types
export type ResearchEntryType = 'QUESTION' | 'CALCULATION' | 'ANSWER' | 'NOTE';
export type ResearchVisibility = 'PRIVATE' | 'TEAM';

// Calculator types
export type CalculatorType = 
  | 'TaxLot' 
  | 'Scenario' 
  | 'DCF-lite' 
  | 'CPI-adjusted-gain'
  | 'Position-sizing'
  | 'Risk-reward'
  | 'Custom';

export interface ResearchEntry {
  id: string;
  user_id: string;
  company_id: string | null;
  ticker: string | null;
  created_at: string;
  updated_at: string;
  entry_type: ResearchEntryType;
  title: string;
  question_text: string | null;
  calculator_type: string | null;
  inputs_json: Json;
  outputs_json: Json;
  output_summary: string | null;
  visibility: ResearchVisibility;
  related_holding_id: string | null;
  tags: string[];
}

export interface CreateResearchEntry {
  company_id?: string | null;
  ticker?: string | null;
  entry_type: ResearchEntryType;
  title: string;
  question_text?: string | null;
  calculator_type?: string | null;
  inputs_json?: Json;
  outputs_json?: Json;
  output_summary?: string | null;
  visibility?: ResearchVisibility;
  related_holding_id?: string | null;
  tags?: string[];
}

// Hook for a specific company's research entries
export function useCompanyResearch(companyId: string | null) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user || !companyId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('company_research_entries')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load research entries:', error);
      toast.error('Failed to load research entries');
    } else {
      setEntries((data as ResearchEntry[]) || []);
    }
    setLoading(false);
  }, [user, companyId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async (entry: CreateResearchEntry): Promise<ResearchEntry | null> => {
    if (!user) return null;

    const insertData = {
      user_id: user.id,
      company_id: entry.company_id || null,
      ticker: entry.ticker || null,
      entry_type: entry.entry_type,
      title: entry.title,
      question_text: entry.question_text || null,
      calculator_type: entry.calculator_type || null,
      inputs_json: (entry.inputs_json || {}) as Json,
      outputs_json: (entry.outputs_json || {}) as Json,
      output_summary: entry.output_summary || null,
      visibility: entry.visibility || 'PRIVATE',
      related_holding_id: entry.related_holding_id || null,
      tags: entry.tags || [],
    };

    const { data, error } = await supabase
      .from('company_research_entries')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create research entry:', error);
      toast.error('Failed to create entry');
      return null;
    }

    const newEntry = data as ResearchEntry;
    setEntries(prev => [newEntry, ...prev]);
    toast.success('Entry created');
    return newEntry;
  };

  const updateEntry = async (
    id: string, 
    updates: Partial<CreateResearchEntry>
  ): Promise<boolean> => {
    const updateData: Record<string, unknown> = {};
    if (updates.company_id !== undefined) updateData.company_id = updates.company_id;
    if (updates.ticker !== undefined) updateData.ticker = updates.ticker;
    if (updates.entry_type !== undefined) updateData.entry_type = updates.entry_type;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.question_text !== undefined) updateData.question_text = updates.question_text;
    if (updates.calculator_type !== undefined) updateData.calculator_type = updates.calculator_type;
    if (updates.inputs_json !== undefined) updateData.inputs_json = updates.inputs_json;
    if (updates.outputs_json !== undefined) updateData.outputs_json = updates.outputs_json;
    if (updates.output_summary !== undefined) updateData.output_summary = updates.output_summary;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    if (updates.related_holding_id !== undefined) updateData.related_holding_id = updates.related_holding_id;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { error } = await supabase
      .from('company_research_entries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update research entry:', error);
      toast.error('Failed to update entry');
      return false;
    }

    setEntries(prev => 
      prev.map(e => e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e)
    );
    return true;
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('company_research_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete research entry:', error);
      toast.error('Failed to delete entry');
      return false;
    }

    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Entry deleted');
    return true;
  };

  return {
    entries,
    loading,
    createEntry,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
}

// Hook to get latest research summary per ticker (for Performance page)
export function useLatestResearchByTicker() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Record<string, ResearchEntry>>({});
  const [loading, setLoading] = useState(true);

  const fetchSummaries = useCallback(async () => {
    if (!user) {
      setSummaries({});
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Get all research entries with output_summary, grouped by ticker
    const { data, error } = await supabase
      .from('company_research_entries')
      .select('*')
      .not('ticker', 'is', null)
      .not('output_summary', 'is', null)
      .in('entry_type', ['CALCULATION', 'ANSWER'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load research summaries:', error);
    } else if (data) {
      // Group by ticker, take the most recent entry per ticker
      const byTicker: Record<string, ResearchEntry> = {};
      for (const entry of data as ResearchEntry[]) {
        const ticker = entry.ticker?.toUpperCase();
        if (ticker && !byTicker[ticker]) {
          byTicker[ticker] = entry;
        }
      }
      setSummaries(byTicker);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const getLatestForTicker = (ticker: string): ResearchEntry | null => {
    return summaries[ticker.toUpperCase()] || null;
  };

  return {
    summaries,
    loading,
    getLatestForTicker,
    refetch: fetchSummaries,
  };
}

// Hook to get all entries for a specific ticker (for Performance side panel)
export function useResearchByTicker(ticker: string | null) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user || !ticker) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('company_research_entries')
      .select('*')
      .ilike('ticker', ticker)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load research entries by ticker:', error);
    } else {
      setEntries((data as ResearchEntry[]) || []);
    }
    setLoading(false);
  }, [user, ticker]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    refetch: fetchEntries,
  };
}
