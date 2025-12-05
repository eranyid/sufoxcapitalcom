import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingSkeleton } from '@/components/LoadingSkeleton';
import { PendingApproval } from '@/components/PendingApproval';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
}

export function ProtectedRoute({ children, requireApproval = true }: ProtectedRouteProps) {
  const { user, loading, isApproved, isAdmin, approvalLoading } = useAuth();

  if (loading || approvalLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If approval is required and user is not approved (and not admin), show pending screen
  if (requireApproval && !isApproved && !isAdmin) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}