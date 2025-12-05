import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Shield, Database, Loader2, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    
    if (!error) {
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    const { error } = await signUp(email, password, displayName);
    setIsLoading(false);
    
    if (!error) {
      setShowEmailConfirmation(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div>
          <div className="bloomberg-gradient-bar w-24 mb-6" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Hedge Fund Studio
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional Portfolio Analytics
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary rounded">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Performance Tracking</h3>
              <p className="text-sm text-muted-foreground">Real-time portfolio analytics with professional-grade metrics</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary rounded">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Risk Management</h3>
              <p className="text-sm text-muted-foreground">Monte Carlo simulations and VaR analysis</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-2 bg-secondary rounded">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Cloud Sync</h3>
              <p className="text-sm text-muted-foreground">Secure data storage across all your devices</p>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          © 2024 Hedge Fund Studio. All rights reserved.
        </p>
      </div>
      
      {/* Right panel - auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="space-y-1">
            <div className="lg:hidden">
              <div className="bloomberg-gradient-bar w-16 mb-4" />
            </div>
            <CardTitle className="text-xl text-foreground">Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border"
                      required
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border"
                      required
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                {showEmailConfirmation ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Check Your Email
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please click the link in your email to verify your account and sign in.
                      </p>
                    </div>
                    <Alert className="bg-secondary/50 border-border">
                      <AlertDescription className="text-xs text-muted-foreground">
                        Didn't receive the email? Check your spam folder or try signing up again.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setShowEmailConfirmation(false);
                        setEmail('');
                        setPassword('');
                        setDisplayName('');
                      }}
                    >
                      Back to Sign Up
                    </Button>
                  </div>
                ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Display Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border"
                      required
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border"
                      required
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
