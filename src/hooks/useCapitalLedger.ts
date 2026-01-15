import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getLedgerEntries, LedgerEntry, LedgerEntryType } from '@/lib/capitalLedger';

export interface UseLedgerOptions {
  currency?: string;
  entryType?: LedgerEntryType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export function useCapitalLedger(options?: UseLedgerOptions) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['capital-ledger', user?.id, options],
    queryFn: async (): Promise<LedgerEntry[]> => {
      if (!user?.id) return [];
      return getLedgerEntries(user.id, options);
    },
    enabled: !!user?.id,
    staleTime: 30_000, // 30 seconds
  });
}
