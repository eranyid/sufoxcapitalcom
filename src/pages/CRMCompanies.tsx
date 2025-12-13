import { useCrmCompanies } from '@/hooks/useCrmCompanies';
import { AddCompanyDialog } from '@/components/crm/AddCompanyDialog';
import { CompaniesTable } from '@/components/crm/CompaniesTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function CRMCompanies() {
  const { companies, loading, createCompany, updateCompany, deleteCompany } = useCrmCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/crm" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-2">
            <ChevronLeft size={14} className="mr-1" />
            Back to CRM
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Potential Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and evaluate potential investment targets</p>
        </div>
        <AddCompanyDialog onAdd={createCompany} />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <CompaniesTable 
          companies={companies} 
          onUpdate={updateCompany} 
          onDelete={deleteCompany} 
        />
      )}
    </div>
  );
}
