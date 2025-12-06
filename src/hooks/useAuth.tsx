import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  approvalLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshApprovalStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const { toast } = useToast();

  // Fetch admin status from server-side user_roles table
  const fetchAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });

      if (error) {
        console.error('Error fetching admin status:', error);
        return false;
      }
      return data === true;
    } catch (error) {
      console.error('Error fetching admin status:', error);
      return false;
    }
  };

  const fetchApprovalStatus = async (userId: string) => {
    try {
      // Fetch admin status from server-side
      const adminStatus = await fetchAdminStatus(userId);
      setIsAdmin(adminStatus);

      const { data, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching approval status:', error);
        setIsApproved(false);
      } else if (data) {
        // Admin is always approved
        if (adminStatus) {
          setIsApproved(true);
        } else {
          setIsApproved(data.is_approved || false);
        }
      } else {
        setIsApproved(false);
      }
    } catch (error) {
      console.error('Error fetching approval status:', error);
      setIsApproved(false);
    } finally {
      setApprovalLoading(false);
    }
  };

  const refreshApprovalStatus = async () => {
    if (user?.id) {
      setApprovalLoading(true);
      await fetchApprovalStatus(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fetch approval status when user changes
        if (session?.user?.id) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            fetchApprovalStatus(session.user.id);
          }, 0);
        } else {
          setIsApproved(false);
          setIsAdmin(false);
          setApprovalLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user?.id) {
        fetchApprovalStatus(session.user.id);
      } else {
        setApprovalLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message
      });
      return { error };
    }

    // Don't show toast here - we'll show the pending approval message in the Auth page
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      let message = error.message;
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please try again.';
      }
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: message
      });
      return { error };
    }

    toast({
      title: "Welcome back!",
      description: "Successfully signed in."
    });
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsApproved(false);
    setIsAdmin(false);
    toast({
      title: "Signed out",
      description: "You've been signed out."
    });
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message
      });
      return { error };
    }

    toast({
      title: "Check your email",
      description: "We sent you a password reset link."
    });
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isApproved, 
      isAdmin,
      approvalLoading,
      signUp, 
      signIn, 
      signOut, 
      resetPassword,
      refreshApprovalStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
