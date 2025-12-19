import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export type ActivityAction = 
  | 'trade_buy' 
  | 'trade_sell' 
  | 'rebalance_planned' 
  | 'rebalance_executed'
  | 'crm_add'
  | 'crm_move'
  | 'crm_update'
  | 'research_add'
  | 'watchlist_convert'
  | 'compliance_check_manual'
  | 'task_created'
  | 'task_deleted'
  | 'status_changed';

interface LogActivityParams {
  projectId: string;
  ticker: string;
  action: ActivityAction;
  details?: Json;
  sourceTransactionId?: string;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async ({
    projectId,
    ticker,
    action,
    details,
    sourceTransactionId
  }: LogActivityParams) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('crm_activity_log')
      .insert([{
        user_id: user.id,
        project_id: projectId,
        ticker,
        action,
        details: details ?? null,
        source_transaction_id: sourceTransactionId ?? null
      }]);

    if (error) {
      console.error('Failed to log activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }, [user]);

  const logRebalanceActivity = useCallback(async (
    projectId: string,
    analysis: {
      trades: Array<{ ticker: string; action: string; value: number; weightChange: number }>;
      totalTurnover: number;
      numberOfTrades: number;
      cashImpact: number;
    }
  ) => {
    if (!user || !projectId) return { success: false };

    // Log summary entry
    const { error } = await supabase
      .from('crm_activity_log')
      .insert([{
        user_id: user.id,
        project_id: projectId,
        ticker: 'PORTFOLIO',
        action: 'rebalance_planned',
        details: {
          numberOfTrades: analysis.numberOfTrades,
          totalTurnover: analysis.totalTurnover,
          cashImpact: analysis.cashImpact,
          trades: analysis.trades.map(t => ({
            ticker: t.ticker,
            action: t.action,
            value: t.value,
            weightChange: t.weightChange
          }))
        }
      }]);

    if (error) {
      console.error('Failed to log rebalance activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }, [user]);

  return {
    logActivity,
    logRebalanceActivity
  };
}
