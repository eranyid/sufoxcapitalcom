import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';

export function PendingApproval() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen min-h-dvh bg-background flex items-center justify-center p-4 safe-area-inset">
      <Card className="w-full max-w-md bg-card border-border text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto p-4 bg-yellow-500/10 rounded-full w-fit">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-xl text-foreground">Account Pending Approval</CardTitle>
          <CardDescription className="text-base">
            Your account is pending approval by the administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            You'll receive access once your account is approved. This typically takes 1-2 business days.
          </p>
          
          <div className="p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• The administrator will review your registration</li>
              <li>• You'll be notified once your account is approved</li>
              <li>• After approval, you can sign in and access the platform</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            onClick={signOut}
            className="w-full h-12 text-base border-border hover:bg-secondary"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}