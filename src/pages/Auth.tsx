import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePasskey } from '@/hooks/usePasskey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Shield, Database, Loader2, Mail, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FaceIdIcon } from '@/components/icons/FaceIdIcon';
import { z } from 'zod';
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [faceIdError, setFaceIdError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const {
    signIn,
    signUp,
    user,
    loading,
    resetPassword
  } = useAuth();
  const {
    isSupported: isFaceIdSupported,
    hasPasskey,
    isLoading: isFaceIdLoading,
    checkHasPasskey,
    registerPasskey,
    authenticateWithPasskey
  } = usePasskey();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  const validateForm = (isSignUp = false) => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const {
      error
    } = await signIn(email, password);
    setIsLoading(false);
    if (!error) {
      // After successful login, offer passkey setup if supported and not already set up
      if (isFaceIdSupported && !hasPasskey) {
        setShowPasskeySetup(true);
      } else {
        navigate('/');
      }
    }
  };
  const handleFaceIdSignIn = async () => {
    setFaceIdError(null);
    const success = await authenticateWithPasskey();
    if (success) {
      navigate('/');
    }
  };
  const handleSetupPasskey = async () => {
    const success = await registerPasskey();
    if (success) {
      navigate('/');
    }
  };
  const handleSkipPasskeySetup = () => {
    setShowPasskeySetup(false);
    navigate('/');
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(forgotPasswordEmail);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    setIsLoading(true);
    const { error } = await resetPassword(forgotPasswordEmail);
    setIsLoading(false);
    if (!error) {
      setForgotPasswordSent(true);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    setIsLoading(true);
    const {
      error
    } = await signUp(email, password, displayName);
    setIsLoading(false);
    if (!error) {
      setShowEmailConfirmation(true);
    }
  };
  if (loading) {
    return <div className="min-h-screen min-h-dvh bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen min-h-dvh bg-background flex flex-col lg:flex-row">
      {/* Left panel - branding (hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div>
          <div className="bloomberg-gradient-bar w-24 mb-6" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">SUFOX CAPITAL LP</h1>
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
        
        <p className="text-xs text-muted-foreground">© 2024 SUFOX CAPITAL LP. All rights reserved.</p>
      </div>
      
      {/* Right panel - auth forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 safe-area-inset">
        {/* Mobile branding header */}
        <div className="lg:hidden w-full max-w-md mb-8">
          <div className="bloomberg-gradient-bar w-16 mb-4" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Hedge Fund Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Professional Portfolio Analytics
          </p>
        </div>

        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-foreground">Welcome</CardTitle>
            <CardDescription className="text-sm">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary h-12">
                <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 text-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 text-sm">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </Label>
                    <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-input border-border h-12 text-base" autoComplete="email" required />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                        Password
                      </Label>
                      <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input id="signin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-input border-border h-12 text-base pr-12" autoComplete="current-password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe} 
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>

                  {/* Face ID Sign In Button */}
                  {isFaceIdSupported && <div className="mt-4 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                      </div>
                      
                      <Button type="button" variant="outline" className="w-full h-12 text-base font-medium border-border hover:bg-secondary/50 safe-area-bottom" onClick={handleFaceIdSignIn} disabled={isFaceIdLoading}>
                        {isFaceIdLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FaceIdIcon className="h-5 w-5 mr-2" />}
                        Sign in with Face ID
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Use Face ID for quick, secure access on this device.
                      </p>
                      
                      {faceIdError && <p className="text-xs text-destructive text-center">{faceIdError}</p>}
                    </div>}
                </form>
              </TabsContent>
              
              {/* Passkey Setup Prompt */}
              {showPasskeySetup && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 safe-area-inset">
                  <Card className="w-full max-w-md bg-card border-border">
                    <CardHeader className="text-center space-y-4">
                      <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit">
                        <FaceIdIcon className="h-12 w-12 text-primary" />
                      </div>
                      <CardTitle className="text-xl">Enable Face ID</CardTitle>
                      <CardDescription>
                        Set up Face ID for faster, more secure sign-ins on this device.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button onClick={handleSetupPasskey} className="w-full h-12 text-base font-medium bg-primary text-primary-foreground" disabled={isFaceIdLoading}>
                        {isFaceIdLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FaceIdIcon className="h-5 w-5 mr-2" />}
                        Set Up Face ID
                      </Button>
                      <Button variant="ghost" onClick={handleSkipPasskeySetup} className="w-full h-11 text-sm text-muted-foreground" disabled={isFaceIdLoading}>
                        Not Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>}

              {/* Forgot Password Modal */}
              {showForgotPassword && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 safe-area-inset">
                  <Card className="w-full max-w-md bg-card border-border">
                    <CardHeader className="space-y-4">
                      <button type="button" onClick={() => { setShowForgotPassword(false); setForgotPasswordSent(false); setForgotPasswordEmail(''); setErrors({}); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                      </button>
                      <div className="text-center space-y-2">
                        <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit">
                          <Mail className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Reset Password</CardTitle>
                        <CardDescription>
                          {forgotPasswordSent 
                            ? "Check your email for the reset link"
                            : "Enter your email and we'll send you a reset link"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {forgotPasswordSent ? (
                        <div className="space-y-4 text-center">
                          <div className="flex justify-center">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            We sent a password reset link to <span className="font-medium text-foreground">{forgotPasswordEmail}</span>
                          </p>
                          <Button onClick={() => { setShowForgotPassword(false); setForgotPasswordSent(false); setForgotPasswordEmail(''); }} className="w-full h-12 text-base font-medium">
                            Back to Sign In
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                              Email
                            </Label>
                            <Input id="forgot-email" type="email" placeholder="you@example.com" value={forgotPasswordEmail} onChange={e => setForgotPasswordEmail(e.target.value)} className="bg-input border-border h-12 text-base" autoComplete="email" required />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                          </div>
                          <Button type="submit" className="w-full h-12 text-base font-medium bg-primary text-primary-foreground" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            Send Reset Link
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>}

              <TabsContent value="signup" className="mt-6">
                {showEmailConfirmation ? <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Mail className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Account Created
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please click the link in your email to verify your account.
                      </p>
                    </div>
                    <Alert className="bg-yellow-500/10 border-yellow-500/30">
                      <AlertDescription className="text-xs text-yellow-200">
                        <strong>Important:</strong> After email verification, your account will be pending admin approval. You'll receive access once the administrator approves your registration.
                      </AlertDescription>
                    </Alert>
                    <Alert className="bg-secondary/50 border-border">
                      <AlertDescription className="text-xs text-muted-foreground">
                        Didn't receive the email? Check your spam folder or try signing up again.
                      </AlertDescription>
                    </Alert>
                    <Button variant="outline" className="mt-4 h-11" onClick={() => {
                  setShowEmailConfirmation(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setDisplayName('');
                }}>
                      Back to Sign Up
                    </Button>
                  </div> : <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Display Name
                    </Label>
                    <Input id="signup-name" type="text" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-input border-border h-12 text-base" autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-input border-border h-12 text-base" autoComplete="email" required />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-input border-border h-12 text-base pr-12" autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input id="signup-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-input border-border h-12 text-base pr-12" autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Mobile footer */}
        <p className="lg:hidden text-xs text-muted-foreground mt-8 text-center">
          © 2024 Hedge Fund Studio. All rights reserved.
        </p>
      </div>
    </div>;
}