import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Check, X, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';

const ADMIN_EMAIL = 'eran.yidgar@sufoxcapital.com';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_approved: boolean;
  approval_status: string;
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if current user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to view this page."
      });
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true, approval_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Approved",
        description: "The user can now access the application."
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve user"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false, approval_status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Rejected",
        description: "The user's access has been denied."
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject user"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (status === 'approved' || isApproved) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
  };

  const pendingUsers = users.filter(u => u.approval_status === 'pending' && !u.is_approved);
  const allUsers = users;

  if (authLoading || (!isAdmin && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">ADMIN // USER MANAGEMENT</h1>
          <p className="text-sm text-muted-foreground">Approve or reject user registrations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingUsers.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-400 font-bold">{pendingUsers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Approved Users</p>
                <p className="text-2xl font-bold text-green-400">
                  {users.filter(u => u.is_approved).length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">User Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-secondary mb-4">
              <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Pending ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All Users ({allUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending user registrations
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Email</TableHead>
                        <TableHead className="text-muted-foreground">Name</TableHead>
                        <TableHead className="text-muted-foreground">Signup Date</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((u) => (
                        <TableRow key={u.id} className="border-border">
                          <TableCell className="font-mono text-sm">{u.email || 'N/A'}</TableCell>
                          <TableCell>{u.display_name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>{getStatusBadge(u.approval_status, u.is_approved)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(u.id)}
                                disabled={actionLoading === u.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {actionLoading === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(u.id)}
                                disabled={actionLoading === u.id}
                              >
                                {actionLoading === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Email</TableHead>
                        <TableHead className="text-muted-foreground">Name</TableHead>
                        <TableHead className="text-muted-foreground">Signup Date</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((u) => (
                        <TableRow key={u.id} className="border-border">
                          <TableCell className="font-mono text-sm">
                            {u.email || 'N/A'}
                            {u.email === ADMIN_EMAIL && (
                              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell>{u.display_name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>{getStatusBadge(u.approval_status, u.is_approved)}</TableCell>
                          <TableCell className="text-right">
                            {u.email !== ADMIN_EMAIL && (
                              <div className="flex items-center justify-end gap-2">
                                {!u.is_approved && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(u.id)}
                                    disabled={actionLoading === u.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {actionLoading === u.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                )}
                                {u.is_approved && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(u.id)}
                                    disabled={actionLoading === u.id}
                                  >
                                    {actionLoading === u.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <X className="h-4 w-4 mr-1" />
                                        Revoke
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}