import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Currency } from '@/types/investment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings as SettingsIcon, Save, RefreshCw, Trash2, Database, User, Mail, Lock, Loader2, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'OTHER'];

const emailSchema = z.string().email({ message: "Invalid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, transactions, valuations, refreshMetrics, clearAllData, sampleDataMode, setSampleDataMode } = usePortfolio();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [riskFreeRate, setRiskFreeRate] = useState(settings.riskFreeRate.toString());
  const [baseCurrency, setBaseCurrency] = useState<Currency>(settings.baseCurrency);
  const [benchmarkReturns, setBenchmarkReturns] = useState(
    settings.benchmarkReturns.join(', ')
  );

  // Account preferences state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      toast.success('Avatar updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Clear all user data first
      await clearAllData();
      
      // Delete profile
      if (user) {
        await supabase.from('profiles').delete().eq('id', user.id);
      }

      // Sign out
      await signOut();
      
      toast.success('Account deleted. Goodbye!');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleUpdateEmail = async () => {
    const validation = emailSchema.safeParse(newEmail);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Confirmation email sent to your new address. Please check your inbox.');
      setNewEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSave = async () => {
    const returns = benchmarkReturns
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));

    await updateSettings({
      riskFreeRate: parseFloat(riskFreeRate) || 4.5,
      baseCurrency,
      benchmarkReturns: returns
    });
    
    toast.success('Settings saved');
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      await clearAllData();
      toast.success('All data cleared');
    }
  };

  const handleSampleDataToggle = (enabled: boolean) => {
    setSampleDataMode(enabled);
    toast.success(enabled ? 'Sample data mode enabled' : 'Showing your data');
  };

  return (
    <div className="section-spacing animate-fade-in max-w-3xl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Configure portfolio and account preferences</p>
      </div>

      {/* Account Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Preferences
          </CardTitle>
          <CardDescription>
            Manage your profile, avatar, email, and password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-muted text-primary text-xl">
                {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Avatar
              </Button>
              <p className="text-xs text-muted-foreground">Max 2MB, JPG/PNG</p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label>Display Name</Label>
            <div className="flex gap-2">
              <Input 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
              <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Change Email
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Current: {user?.email}
            </p>
            <div className="flex gap-2">
              <Input 
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
              />
              <Button onClick={handleUpdateEmail} disabled={isUpdatingEmail || !newEmail}>
                {isUpdatingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A confirmation email will be sent to your new address
            </p>
          </div>

          {/* Password */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Change Password
            </Label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !newPassword || !confirmPassword}>
              {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </div>

          {/* Delete Account */}
          <div className="space-y-3 pt-4 border-t border-destructive/30">
            <Label className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Delete Account
            </Label>
            <p className="text-xs text-muted-foreground">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Account Permanently?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>This action cannot be undone. All your data will be permanently deleted:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>All transactions and valuations</li>
                      <li>Portfolio settings and cash balances</li>
                      <li>Custom scenarios</li>
                      <li>Profile information</li>
                    </ul>
                    <div className="pt-2">
                      <Label className="text-sm font-medium">Type DELETE to confirm:</Label>
                      <Input 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Risk Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Risk Parameters
          </CardTitle>
          <CardDescription>
            Configure risk-free rate and benchmark for Sharpe ratio and Beta calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Risk-Free Rate (%)</Label>
              <Input 
                type="number"
                step="0.1"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(e.target.value)}
                placeholder="4.5"
              />
              <p className="text-xs text-muted-foreground">
                Annual risk-free rate (e.g., 10Y Treasury yield)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <Select value={baseCurrency} onValueChange={(v: Currency) => setBaseCurrency(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reporting currency for all metrics
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Benchmark Monthly Returns (%)</Label>
            <Textarea 
              value={benchmarkReturns}
              onChange={(e) => setBenchmarkReturns(e.target.value)}
              placeholder="1.2, 0.8, -0.5, 2.1, 1.5..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Enter comma-separated monthly benchmark returns for Beta calculation (e.g., S&P 500 monthly returns)
            </p>
          </div>

          <Button onClick={handleSave} className="gradient-gold text-primary-foreground">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Sample Data Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Sample Data Mode
          </CardTitle>
          <CardDescription>
            Toggle to view sample portfolio data. Your own data is preserved and will return when you turn this off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">{sampleDataMode ? 'Sample Data Active' : 'Your Data Active'}</p>
              <p className="text-sm text-muted-foreground">
                {sampleDataMode 
                  ? 'Viewing demo portfolio with 14 transactions across equities, bonds & crypto' 
                  : 'Viewing your personal portfolio data'}
              </p>
            </div>
            <Switch 
              checked={sampleDataMode} 
              onCheckedChange={handleSampleDataToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary {sampleDataMode && <span className="text-xs text-primary ml-2">(Sample)</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{valuations.length}</p>
              <p className="text-sm text-muted-foreground">Valuations</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {new Set(transactions.map(t => t.ticker)).size}
              </p>
              <p className="text-sm text-muted-foreground">Unique Assets</p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={refreshMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" /> Recalculate Metrics
            </Button>
            <Button variant="destructive" onClick={handleClearData} disabled={sampleDataMode}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear Your Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">1. Add Transactions</h4>
            <p>Record all buy and sell transactions with date, quantity, price, and fees.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">2. Add Monthly Valuations</h4>
            <p>At month-end, record the NAV or market price for each asset. Include FX rates if applicable.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">3. Set Risk Parameters</h4>
            <p>Configure the risk-free rate (current Treasury yield) and optionally add benchmark returns for Beta calculation.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">4. Review Analytics</h4>
            <p>The dashboard automatically calculates P/L, returns, volatility, Sharpe, drawdowns, VaR, and more.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
