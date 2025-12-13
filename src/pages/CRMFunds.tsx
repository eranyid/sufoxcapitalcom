import { useCrmFunds } from '@/hooks/useCrmFunds';
import { AddFundDialog } from '@/components/crm/AddFundDialog';
import { FundsTable } from '@/components/crm/FundsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function CRMFunds() {
  const { funds, loading, createFund, updateFund, deleteFund } = useCrmFunds();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/crm" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-2">
            <ChevronLeft size={14} className="mr-1" />
            Back to CRM
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Potential Funds</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor fund opportunities and due diligence pipeline</p>
        </div>
        <AddFundDialog onAdd={createFund} />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <FundsTable 
          funds={funds} 
          onUpdate={updateFund} 
          onDelete={deleteFund} 
        />
      )}
    </div>
  );
}
