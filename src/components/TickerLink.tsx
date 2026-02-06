import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TickerLinkProps {
  ticker: string;
  className?: string;
  children?: React.ReactNode;
}

// Cache company lookups to avoid repeated queries
const companyCache = new Map<string, { id: string; name: string } | null>();

export function TickerLink({ ticker, className, children }: TickerLinkProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<{ id: string; name: string } | null | undefined>(
    companyCache.has(ticker) ? companyCache.get(ticker) : undefined
  );

  useEffect(() => {
    if (!user || !ticker || companyCache.has(ticker)) return;

    const lookup = async () => {
      const { data } = await supabase
        .from('crm_companies')
        .select('id, company_name')
        .eq('user_id', user.id)
        .ilike('ticker', ticker)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();

      const result = data ? { id: data.id, name: data.company_name } : null;
      companyCache.set(ticker, result);
      setCompany(result);
    };

    lookup();
  }, [ticker, user]);

  if (company === undefined) {
    // Still loading — render plain
    return <span className={className}>{children || ticker}</span>;
  }

  if (!company) {
    // No linked company — render plain
    return <span className={className}>{children || ticker}</span>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate(`/analysis/${company.id}`)}
            className={cn(
              "hover:underline cursor-pointer transition-colors hover:text-primary/80",
              className
            )}
          >
            {children || ticker}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">View {company.name} analysis</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
