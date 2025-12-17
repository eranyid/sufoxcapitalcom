import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/investment';
import { toast } from 'sonner';

const LAST_PROJECT_KEY = 'crm_last_project_id';

interface SyncResult {
  success: boolean;
  action?: 'auto_add_ongoing' | 'auto_move_old_exits' | 'no_change';
  ticker?: string;
  error?: string;
}

/**
 * Calculate net position quantity for a ticker from all transactions
 */
function calculatePositionQuantity(transactions: Transaction[], ticker: string): number {
  return transactions
    .filter(tx => tx.ticker.toUpperCase() === ticker.toUpperCase())
    .reduce((sum, tx) => {
      if (tx.transactionType === 'buy') {
        return sum + tx.quantity;
      } else {
        return sum - tx.quantity;
      }
    }, 0);
}

/**
 * Get the first buy date for a ticker
 */
function getFirstBuyDate(transactions: Transaction[], ticker: string): string | null {
  const buyTxs = transactions
    .filter(tx => tx.ticker.toUpperCase() === ticker.toUpperCase() && tx.transactionType === 'buy')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return buyTxs.length > 0 ? buyTxs[0].date : null;
}

/**
 * Get the last sell date for a ticker (when position went to zero)
 */
function getLastSellDate(transactions: Transaction[], ticker: string): string | null {
  const sellTxs = transactions
    .filter(tx => tx.ticker.toUpperCase() === ticker.toUpperCase() && tx.transactionType === 'sell')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return sellTxs.length > 0 ? sellTxs[0].date : null;
}

/**
 * Sync CRM Companies board based on transaction activity
 */
export async function syncCrmFromTransaction(
  userId: string,
  allTransactions: Transaction[],
  newTransaction: Omit<Transaction, 'id'> & { id?: string },
  transactionId?: string
): Promise<SyncResult> {
  const ticker = newTransaction.ticker.toUpperCase();
  const assetName = newTransaction.assetName;
  const geography = newTransaction.geography;
  
  // Get active project from localStorage
  const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
  
  if (!lastProjectId) {
    // No active project - show warning but don't fail
    console.warn('No CRM project selected - skipping CRM sync');
    return { success: true, action: 'no_change', ticker };
  }

  // Verify project exists and belongs to user
  const { data: project, error: projectError } = await supabase
    .from('crm_projects')
    .select('id')
    .eq('id', lastProjectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    console.warn('Active CRM project not found or inaccessible');
    return { success: true, action: 'no_change', ticker };
  }

  // Calculate resulting position (include the new transaction)
  const existingQuantity = calculatePositionQuantity(allTransactions, ticker);
  const newQuantityDelta = newTransaction.transactionType === 'buy' 
    ? newTransaction.quantity 
    : -newTransaction.quantity;
  const resultingQuantity = existingQuantity + newQuantityDelta;

  // Check if CRM row exists for this ticker
  const { data: existingCompany } = await supabase
    .from('crm_companies')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', lastProjectId)
    .eq('ticker', ticker)
    .maybeSingle();

  if (resultingQuantity > 0) {
    // Position is open - should be in Ongoing Holding
    if (existingCompany) {
      // Row exists - only update group_name if not already ongoing_holding
      if (existingCompany.group_name !== 'ongoing_holding') {
        const { error: updateError } = await supabase
          .from('crm_companies')
          .update({
            group_name: 'ongoing_holding',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCompany.id);

        if (updateError) {
          console.error('Failed to update CRM company:', updateError);
          return { success: false, error: updateError.message, ticker };
        }

        // Log the activity
        await logCrmActivity(userId, lastProjectId, ticker, 'auto_add_ongoing', transactionId);
        
        toast.success(`${ticker} moved to Ongoing Holding`);
        return { success: true, action: 'auto_add_ongoing', ticker };
      }
      // Already in ongoing_holding - no change needed
      return { success: true, action: 'no_change', ticker };
    } else {
      // Create new row in Ongoing Holding
      const firstBuyDate = getFirstBuyDate(allTransactions, ticker) || newTransaction.date;
      
      const { error: insertError } = await supabase
        .from('crm_companies')
        .insert({
          user_id: userId,
          project_id: lastProjectId,
          ticker: ticker,
          company_name: assetName,
          group_name: 'ongoing_holding',
          status: 'working_on_it',
          geography: geography || null,
          timeline_start: firstBuyDate,
          is_auto_linked: true,
          source_transaction_id: transactionId || null
        });

      if (insertError) {
        console.error('Failed to create CRM company:', insertError);
        return { success: false, error: insertError.message, ticker };
      }

      // Log the activity
      await logCrmActivity(userId, lastProjectId, ticker, 'auto_add_ongoing', transactionId);
      
      toast.success(`${ticker} added to CRM Ongoing Holding`);
      return { success: true, action: 'auto_add_ongoing', ticker };
    }
  } else if (resultingQuantity === 0 && existingCompany) {
    // Position fully exited - move to Old Exits
    if (existingCompany.group_name !== 'old_exits') {
      const exitDate = getLastSellDate(allTransactions, ticker) || newTransaction.date;
      
      const updateData: Record<string, unknown> = {
        group_name: 'old_exits',
        updated_at: new Date().toISOString()
      };
      
      // Only set timeline_end if not already set
      if (!existingCompany.timeline_end) {
        updateData.timeline_end = exitDate;
      }

      const { error: updateError } = await supabase
        .from('crm_companies')
        .update(updateData)
        .eq('id', existingCompany.id);

      if (updateError) {
        console.error('Failed to move CRM company to Old Exits:', updateError);
        return { success: false, error: updateError.message, ticker };
      }

      // Log the activity
      await logCrmActivity(userId, lastProjectId, ticker, 'auto_move_old_exits', transactionId);
      
      toast.info(`${ticker} moved to Old Exits (position closed)`);
      return { success: true, action: 'auto_move_old_exits', ticker };
    }
    // Already in old_exits - no change
    return { success: true, action: 'no_change', ticker };
  }

  // No action needed (e.g., resultingQuantity < 0 shouldn't happen with validation)
  return { success: true, action: 'no_change', ticker };
}

/**
 * Log CRM activity for auditability
 */
async function logCrmActivity(
  userId: string,
  projectId: string,
  ticker: string,
  action: 'auto_add_ongoing' | 'auto_move_old_exits' | 'manual_edit',
  sourceTransactionId?: string
): Promise<void> {
  try {
    await supabase
      .from('crm_activity_log')
      .insert({
        user_id: userId,
        project_id: projectId,
        ticker: ticker,
        action: action,
        source_transaction_id: sourceTransactionId || null,
        details: { timestamp: new Date().toISOString() }
      });
  } catch (error) {
    console.error('Failed to log CRM activity:', error);
    // Don't fail the main operation if logging fails
  }
}

/**
 * Reconcile all CRM entries based on current holdings
 * Useful for bulk reconciliation or fixing inconsistencies
 */
export async function reconcileAllCrmEntries(
  userId: string,
  transactions: Transaction[]
): Promise<void> {
  const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
  if (!lastProjectId) return;

  // Get unique tickers from transactions
  const tickers = [...new Set(transactions.map(tx => tx.ticker.toUpperCase()))];

  for (const ticker of tickers) {
    const quantity = calculatePositionQuantity(transactions, ticker);
    
    // Get existing CRM entry
    const { data: existingCompany } = await supabase
      .from('crm_companies')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', lastProjectId)
      .eq('ticker', ticker)
      .maybeSingle();

    if (existingCompany) {
      const targetGroup = quantity > 0 ? 'ongoing_holding' : 'old_exits';
      
      if (existingCompany.group_name !== targetGroup && quantity !== 0) {
        await supabase
          .from('crm_companies')
          .update({ group_name: targetGroup })
          .eq('id', existingCompany.id);
      }
    }
  }
}
