import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DeletedItem {
  id: string;
  type: 'transaction' | 'valuation' | 'company' | 'fund' | 'task' | 'project';
  name: string;
  deleted_at: string;
  details: Record<string, unknown>;
}

export function useTrash() {
  const { user } = useAuth();
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeletedItems = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [txRes, valRes, compRes, fundRes, taskRes, projRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .not('deleted_at', 'is', null),
        supabase
          .from('valuations')
          .select('*')
          .eq('user_id', user.id)
          .not('deleted_at', 'is', null),
        supabase
          .from('crm_companies')
          .select('*')
          .eq('user_id', user.id)
          .not('deleted_at', 'is', null),
        supabase
          .from('crm_funds')
          .select('*')
          .eq('user_id', user.id)
          .not('deleted_at', 'is', null),
        supabase
          .from('crm_tasks')
          .select('*')
          .eq('user_id', user.id)
          .not('deleted_at', 'is', null),
        supabase
          .from('crm_projects')
          .select('*')
          .eq('user_id', user.id)
          .not('deleted_at', 'is', null),
      ]);

      const allItems: DeletedItem[] = [];

      if (txRes.data) {
        txRes.data.forEach(tx => {
          allItems.push({
            id: tx.id,
            type: 'transaction',
            name: `${tx.transaction_type.toUpperCase()} ${tx.ticker} - ${tx.quantity} @ ${tx.price_per_unit}`,
            deleted_at: tx.deleted_at!,
            details: tx,
          });
        });
      }

      if (valRes.data) {
        valRes.data.forEach(val => {
          allItems.push({
            id: val.id,
            type: 'valuation',
            name: `${val.ticker} - ${val.month} @ ${val.price_per_unit}`,
            deleted_at: val.deleted_at!,
            details: val,
          });
        });
      }

      if (compRes.data) {
        compRes.data.forEach(comp => {
          allItems.push({
            id: comp.id,
            type: 'company',
            name: comp.company_name,
            deleted_at: comp.deleted_at!,
            details: comp,
          });
        });
      }

      if (fundRes.data) {
        fundRes.data.forEach(fund => {
          allItems.push({
            id: fund.id,
            type: 'fund',
            name: fund.fund_name,
            deleted_at: fund.deleted_at!,
            details: fund,
          });
        });
      }

      if (taskRes.data) {
        taskRes.data.forEach(task => {
          allItems.push({
            id: task.id,
            type: 'task',
            name: task.task_name,
            deleted_at: task.deleted_at!,
            details: task,
          });
        });
      }

      if (projRes.data) {
        projRes.data.forEach(proj => {
          allItems.push({
            id: proj.id,
            type: 'project',
            name: proj.name,
            deleted_at: proj.deleted_at!,
            details: proj,
          });
        });
      }

      // Sort by deleted_at descending (most recent first)
      allItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
      toast.error('Failed to load deleted items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeletedItems();
  }, [fetchDeletedItems]);

  const restoreItem = async (item: DeletedItem) => {
    const tableMap: Record<DeletedItem['type'], string> = {
      transaction: 'transactions',
      valuation: 'valuations',
      company: 'crm_companies',
      fund: 'crm_funds',
      task: 'crm_tasks',
      project: 'crm_projects',
    };

    const tableName = tableMap[item.type] as 'transactions' | 'valuations' | 'crm_companies' | 'crm_funds' | 'crm_tasks' | 'crm_projects';
    
    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: null } as never)
      .eq('id', item.id);

    if (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
      return false;
    }

    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success(`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} restored`);
    return true;
  };

  const permanentlyDelete = async (item: DeletedItem) => {
    const tableMap: Record<DeletedItem['type'], string> = {
      transaction: 'transactions',
      valuation: 'valuations',
      company: 'crm_companies',
      fund: 'crm_funds',
      task: 'crm_tasks',
      project: 'crm_projects',
    };

    const tableName = tableMap[item.type] as 'transactions' | 'valuations' | 'crm_companies' | 'crm_funds' | 'crm_tasks' | 'crm_projects';
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error permanently deleting item:', error);
      toast.error('Failed to permanently delete item');
      return false;
    }

    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success('Permanently deleted');
    return true;
  };

  const emptyTrash = async () => {
    if (!user) return false;

    try {
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', user.id).not('deleted_at', 'is', null),
        supabase.from('valuations').delete().eq('user_id', user.id).not('deleted_at', 'is', null),
        supabase.from('crm_companies').delete().eq('user_id', user.id).not('deleted_at', 'is', null),
        supabase.from('crm_funds').delete().eq('user_id', user.id).not('deleted_at', 'is', null),
        supabase.from('crm_tasks').delete().eq('user_id', user.id).not('deleted_at', 'is', null),
        supabase.from('crm_projects').delete().eq('user_id', user.id).not('deleted_at', 'is', null),
      ]);

      setItems([]);
      toast.success('Trash emptied');
      return true;
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
      return false;
    }
  };

  // Calculate days until permanent deletion
  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  return {
    items,
    loading,
    restoreItem,
    permanentlyDelete,
    emptyTrash,
    getDaysRemaining,
    refetch: fetchDeletedItems,
  };
}
