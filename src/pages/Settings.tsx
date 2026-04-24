import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/context/PortfolioContext';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database as SupabaseDatabase } from '@/integrations/supabase/types';
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
import { Settings as SettingsIcon, Save, RefreshCw, Trash2, Database as DatabaseIcon, User, Mail, Lock, Loader2, Upload, AlertTriangle, LogOut, Bell, Scale, ChevronRight, Calendar, TrendingUp, Rss, HelpCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { CalendarSettingsSection } from '@/components/calendar/CalendarSettingsSection';
import { DataCleanupSection } from '@/components/settings/DataCleanupSection';
import { workbookToBlob, type WorkbookPayload } from '@/lib/xlsxExport';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'OTHER'];

type TransactionRow = SupabaseDatabase['public']['Tables']['transactions']['Row'];
type ValuationRow = SupabaseDatabase['public']['Tables']['valuations']['Row'];
type CrmCompanyRow = SupabaseDatabase['public']['Tables']['crm_companies']['Row'];
type ResearchEntryRow = SupabaseDatabase['public']['Tables']['company_research_entries']['Row'];
type CompanyDecisionRow = SupabaseDatabase['public']['Tables']['company_decisions']['Row'];

type ExportPayload = {
  export_version: number;
  exported_at: string;
  scope: {
    type: 'personal' | 'client';
    client_id: string | null;
  };
  data: {
    analyses: {
      companies: CrmCompanyRow[];
      research_entries: ResearchEntryRow[];
      decisions: CompanyDecisionRow[];
    };
    value_data: ValuationRow[];
    transactions: TransactionRow[];
  };
};

type ExportPreview = {
  analysesCompanies: Array<{ id: string; ticker: string | null }>;
  researchEntries: Array<{ id: string; ticker: string | null }>;
  decisions: Array<{ id: string; ticker: string | null }>;
  valueData: Array<{ id: string; ticker: string | null }>;
  transactions: Array<{ id: string; ticker: string | null }>;
};

type SaveFilePickerWindow = Window & typeof globalThis & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: string | Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

type DownloadPhase =
  | 'building'
  | 'serializing'
  | 'awaiting-save-dialog'
  | 'writing-file'
  | 'fallback-download'
  | 'done'
  | 'error';

type DownloadProgress = {
  label: string;
  phase: DownloadPhase;
  message: string;
  bytes?: number;
  method?: 'save-picker' | 'anchor-fallback';
};

const emailSchema = z.string().email({ message: "Invalid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

// Section Header Component
function SectionHeader({ icon: Icon, title }: { icon: typeof User; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-8 pb-4 first:pt-0">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground uppercase tracking-wide">{title}</h2>
      <div className="flex-1 h-px bg-border ml-2" />
    </div>
  );
}

const PHASE_STEPS: Array<{ phase: DownloadPhase; label: string }> = [
  { phase: 'building', label: 'Build payload' },
  { phase: 'serializing', label: 'Serialize JSON' },
  { phase: 'awaiting-save-dialog', label: 'Save dialog' },
  { phase: 'writing-file', label: 'Write file' },
  { phase: 'done', label: 'Done' },
];

function DownloadProgressPanel({
  progress,
  onDismiss,
}: {
  progress: DownloadProgress;
  onDismiss: () => void;
}) {
  const isError = progress.phase === 'error';
  const isFallback = progress.phase === 'fallback-download' || progress.method === 'anchor-fallback';
  const isDone = progress.phase === 'done';
  const isActive = !isDone && !isError;

  // Build step list — replace "Save dialog" / "Write file" with "Browser download" when fallback path is used.
  const steps = isFallback
    ? [
        { phase: 'building' as DownloadPhase, label: 'Build payload' },
        { phase: 'serializing' as DownloadPhase, label: 'Serialize JSON' },
        { phase: 'fallback-download' as DownloadPhase, label: 'Browser download (fallback)' },
        { phase: 'done' as DownloadPhase, label: 'Done' },
      ]
    : PHASE_STEPS;

  const activeIndex = steps.findIndex((s) => s.phase === progress.phase);
  const completedThrough = isDone ? steps.length - 1 : Math.max(activeIndex, 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-lg border p-4 space-y-3 ${
        isError
          ? 'border-destructive/50 bg-destructive/10'
          : isDone
          ? 'border-primary/40 bg-primary/5'
          : 'border-border/60 bg-muted/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {isDone && (
            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
              ✓
            </div>
          )}
          {isError && <AlertTriangle className="h-4 w-4 text-destructive" />}
          <p className="text-sm font-medium text-foreground">
            {progress.label} —{' '}
            {isError ? 'Failed' : isDone ? 'Complete' : 'In progress'}
          </p>
        </div>
        {(isDone || isError) && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>

      <p className={`text-xs ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
        {progress.message}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, idx) => {
          const completed = idx < completedThrough || (isDone && idx <= completedThrough);
          const current = !isDone && !isError && idx === activeIndex;
          return (
            <div key={step.phase} className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-mono border ${
                  completed
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : current
                    ? 'bg-muted border-border text-foreground animate-pulse'
                    : 'bg-transparent border-border/40 text-muted-foreground'
                }`}
              >
                {idx + 1}. {step.label}
              </span>
              {idx < steps.length - 1 && <span className="text-border text-xs">›</span>}
            </div>
          );
        })}
      </div>

      {(progress.bytes || progress.method) && (
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground font-mono">
          {progress.bytes ? <span>Size: {progress.bytes < 1024 ? `${progress.bytes} B` : progress.bytes < 1024 * 1024 ? `${(progress.bytes / 1024).toFixed(1)} KB` : `${(progress.bytes / (1024 * 1024)).toFixed(2)} MB`}</span> : null}
          {progress.method && (
            <span>
              Method:{' '}
              <span className={progress.method === 'anchor-fallback' ? 'text-primary' : 'text-foreground'}>
                {progress.method === 'save-picker' ? 'Native Save dialog' : 'Browser download (fallback)'}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; ticker: string | null }>;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{rows.length} records</p>
      </div>
      <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-md bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
              <span className="text-foreground">ID:</span> {row.id}
              <span className="mx-2 text-border">•</span>
              <span className="text-foreground">Ticker:</span> {row.ticker || '—'}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No records in this category for the active context.</p>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, transactions, valuations, refreshMetrics, clearAllData, sampleDataMode, setSampleDataMode } = usePortfolio();
  const { user, signOut } = useAuth();
  const { session, isContextSet } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [riskFreeRate, setRiskFreeRate] = useState(settings.riskFreeRate.toString());
  const [baseCurrency, setBaseCurrency] = useState<Currency>(settings.baseCurrency);
  const [benchmarkReturns, setBenchmarkReturns] = useState(
    settings.benchmarkReturns.join(', ')
  );

  // RSS Feed state
  const [rssFeedUrl, setRssFeedUrl] = useState('https://feeds.bloomberg.com/markets/news.rss');
  const [isSavingRss, setIsSavingRss] = useState(false);

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
  const [isExportingData, setIsExportingData] = useState(false);
  const [isPreviewingExport, setIsPreviewingExport] = useState(false);
  const [isDownloadingPreview, setIsDownloadingPreview] = useState(false);
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isExportingTransactionsCsv, setIsExportingTransactionsCsv] = useState(false);
  const [isExportingValuationsCsv, setIsExportingValuationsCsv] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
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

  // Load RSS feed URL
  useEffect(() => {
    const loadRssFeed = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('portfolio_settings')
        .select('rss_feed_url')
        .eq('user_id', user.id)
        .single();
      if (data?.rss_feed_url) {
        setRssFeedUrl(data.rss_feed_url);
      }
    };
    loadRssFeed();
  }, [user]);

  const handleSaveRssFeed = async () => {
    if (!user) return;
    setIsSavingRss(true);
    try {
      const { data: existing } = await supabase
        .from('portfolio_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('portfolio_settings')
          .update({ rss_feed_url: rssFeedUrl || null })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_settings')
          .insert({ user_id: user.id, rss_feed_url: rssFeedUrl || null });
        if (error) throw error;
      }
      toast.success('RSS feed URL saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save RSS feed URL');
    } finally {
      setIsSavingRss(false);
    }
  };

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

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
      await clearAllData();
      
      if (user) {
        await supabase.from('profiles').delete().eq('id', user.id);
      }

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

  const activeClientId = session.scope === 'client' ? session.clientId : null;

  const sortByFields = <T extends Record<string, unknown>>(rows: T[], fields: Array<keyof T>) => {
    return [...rows].sort((a, b) => {
      for (const field of fields) {
        const aValue = a[field];
        const bValue = b[field];

        const normalizedA = aValue == null ? '' : String(aValue);
        const normalizedB = bValue == null ? '' : String(bValue);

        if (normalizedA < normalizedB) return -1;
        if (normalizedA > normalizedB) return 1;
      }

      return 0;
    });
  };

  type DownloadResult = {
    method: 'save-picker' | 'anchor-fallback';
    fileName: string;
    bytes: number;
  };

  const downloadJsonFile = async (
    fileName: string,
    payload: unknown,
    onProgress?: (update: Partial<DownloadProgress> & { phase: DownloadPhase; message: string }) => void
  ): Promise<DownloadResult> => {
    const emit = (update: Partial<DownloadProgress> & { phase: DownloadPhase; message: string }) => {
      onProgress?.(update);
    };

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Downloads are only available in the browser environment.');
    }

    emit({ phase: 'serializing', message: 'Serializing JSON payload…' });

    let jsonString: string;
    try {
      jsonString = JSON.stringify(payload, null, 2);
    } catch (serializationError) {
      const message = serializationError instanceof Error ? serializationError.message : 'Unknown serialization error';
      throw new Error(`Failed to serialize export payload to JSON: ${message}`);
    }

    if (!jsonString || jsonString.length === 0) {
      throw new Error('Export payload produced an empty JSON string. Aborting download.');
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    if (blob.size === 0) {
      throw new Error('Generated file is empty (0 bytes). Aborting download.');
    }

    emit({
      phase: 'fallback-download',
      message: `Saving to your Downloads folder (${formatBytes(blob.size)})…`,
      bytes: blob.size,
      method: 'anchor-fallback',
    });

    // Anchor-based fallback. Verify the URL was created and the click was dispatched.
    let downloadUrl: string;
    try {
      downloadUrl = URL.createObjectURL(blob);
    } catch (urlError) {
      const reason = urlError instanceof Error ? urlError.message : String(urlError);
      throw new Error(`Failed to create download URL: ${reason}`);
    }

    if (!downloadUrl) {
      throw new Error('Failed to create download URL for the export file.');
    }

    try {
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = fileName;
      anchor.rel = 'noopener';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);

      // Use a real MouseEvent so the browser treats this as a user-driven click.
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      const dispatched = anchor.dispatchEvent(clickEvent);
      anchor.remove();

      if (!dispatched) {
        throw new Error('Browser blocked the automatic download. Check pop-up/download permissions.');
      }
    } finally {
      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 2000);
    }

    return { method: 'anchor-fallback', fileName, bytes: blob.size };
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const buildExportPayload = async (): Promise<ExportPayload> => {
    if (!user) {
      throw new Error('You must be signed in to export data');
    }

    if (!isContextSet || !session.scope) {
      throw new Error('Select a personal or client context before exporting');
    }

    let companiesQuery = supabase
      .from('crm_companies')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    let valuationsQuery = supabase
      .from('valuations')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    let transactionsQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (activeClientId) {
      companiesQuery = companiesQuery.eq('client_id', activeClientId);
      valuationsQuery = valuationsQuery.eq('client_id', activeClientId);
      transactionsQuery = transactionsQuery.eq('client_id', activeClientId);
    } else {
      companiesQuery = companiesQuery.is('client_id', null);
      valuationsQuery = valuationsQuery.is('client_id', null);
      transactionsQuery = transactionsQuery.is('client_id', null);
    }

    const [companiesResponse, valuationsResponse, transactionsResponse, researchResponse, decisionsResponse] = await Promise.all([
      companiesQuery,
      valuationsQuery,
      transactionsQuery,
      supabase
        .from('company_research_entries')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('company_decisions')
        .select('*')
        .eq('user_id', user.id),
    ]);

    if (companiesResponse.error) throw companiesResponse.error;
    if (valuationsResponse.error) throw valuationsResponse.error;
    if (transactionsResponse.error) throw transactionsResponse.error;
    if (researchResponse.error) throw researchResponse.error;
    if (decisionsResponse.error) throw decisionsResponse.error;

    const companies = companiesResponse.data ?? [];
    const valueData = valuationsResponse.data ?? [];
    const transactionData = transactionsResponse.data ?? [];
    const researchEntries = researchResponse.data ?? [];
    const companyDecisions = decisionsResponse.data ?? [];

    const exportedCompanyIds = new Set(companies.map((company) => company.id));
    const exportedTickers = new Set(
      [
        ...companies.map((company) => company.ticker),
        ...valueData.map((valuation) => valuation.ticker),
        ...transactionData.map((transaction) => transaction.ticker),
      ].filter((ticker): ticker is string => Boolean(ticker))
    );

    const filteredResearchEntries = researchEntries.filter((entry) => {
      if (entry.company_id && exportedCompanyIds.has(entry.company_id)) {
        return true;
      }

      if (!entry.company_id && entry.ticker && exportedTickers.has(entry.ticker)) {
        return true;
      }

      return false;
    });

    const filteredDecisions = companyDecisions.filter((decision) => {
      if (exportedCompanyIds.has(decision.company_id)) {
        return true;
      }

      if (decision.ticker && exportedTickers.has(decision.ticker)) {
        return true;
      }

      return false;
    });

    return {
      export_version: 1,
      exported_at: new Date().toISOString(),
      scope: {
        type: session.scope,
        client_id: activeClientId,
      },
      data: {
        analyses: {
          companies: sortByFields<CrmCompanyRow>(companies, ['created_at', 'id']),
          research_entries: sortByFields<ResearchEntryRow>(filteredResearchEntries, ['created_at', 'id']),
          decisions: sortByFields<CompanyDecisionRow>(filteredDecisions, ['decision_date', 'created_at', 'id']),
        },
        value_data: sortByFields<ValuationRow>(valueData, ['month', 'created_at', 'id']),
        transactions: sortByFields<TransactionRow>(transactionData, ['date', 'created_at', 'id']),
      },
    };
  };

  const buildExportPreview = (payload: ExportPayload): ExportPreview => ({
    analysesCompanies: payload.data.analyses.companies.map((row) => ({ id: row.id, ticker: row.ticker })),
    researchEntries: payload.data.analyses.research_entries.map((row) => ({ id: row.id, ticker: row.ticker })),
    decisions: payload.data.analyses.decisions.map((row) => ({ id: row.id, ticker: row.ticker })),
    valueData: payload.data.value_data.map((row) => ({ id: row.id, ticker: row.ticker })),
    transactions: payload.data.transactions.map((row) => ({ id: row.id, ticker: row.ticker })),
  });

  const runDownload = async (
    label: string,
    fileName: string,
    buildPayload: () => Promise<unknown>
  ) => {
    setDownloadProgress({ label, phase: 'building', message: 'Gathering data from your context…' });

    try {
      const payload = await buildPayload();

      const result = await downloadJsonFile(fileName, payload, (update) => {
        setDownloadProgress((prev) => ({
          label: prev?.label ?? label,
          phase: update.phase,
          message: update.message,
          bytes: update.bytes ?? prev?.bytes,
          method: update.method ?? prev?.method,
        }));
      });

      setDownloadProgress({
        label,
        phase: 'done',
        message: `Saved ${fileName} (${formatBytes(result.bytes)}) via ${result.method === 'save-picker' ? 'Save dialog' : 'browser download'}.`,
        bytes: result.bytes,
        method: result.method,
      });

      toast.success(
        `${label} saved (${formatBytes(result.bytes)}) via ${result.method === 'save-picker' ? 'Save dialog' : 'browser download'}`
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to download ${label.toLowerCase()}`;
      setDownloadProgress((prev) => ({
        label,
        phase: 'error',
        message,
        bytes: prev?.bytes,
        method: prev?.method,
      }));
      toast.error(message);
      throw error;
    }
  };

  const handleDownloadPreview = async () => {
    setIsDownloadingPreview(true);

    try {
      await runDownload('Preview', 'sufox_data_export_preview.json', async () => {
        const payload = await buildExportPayload();
        return {
          export_version: payload.export_version,
          exported_at: payload.exported_at,
          scope: payload.scope,
          counts: {
            analysis_companies: payload.data.analyses.companies.length,
            research_entries: payload.data.analyses.research_entries.length,
            decisions: payload.data.analyses.decisions.length,
            value_data: payload.data.value_data.length,
            transactions: payload.data.transactions.length,
          },
          identifiers: buildExportPreview(payload),
        };
      });
    } catch {
      // already surfaced via runDownload
    } finally {
      setIsDownloadingPreview(false);
    }
  };

  const handlePreviewExport = async () => {
    setIsPreviewingExport(true);

    try {
      const payload = await buildExportPayload();
      setExportPreview(buildExportPreview(payload));
      toast.success('Export preview is ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to preview export data';
      toast.error(message);
      setExportPreview(null);
    } finally {
      setIsPreviewingExport(false);
    }
  };

  const escapeCsvCell = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    let str: string;
    if (typeof value === 'object') {
      try {
        str = JSON.stringify(value);
      } catch {
        str = String(value);
      }
    } else {
      str = String(value);
    }
    // Quote if contains comma, quote, newline, or carriage return
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rowsToCsv = (rows: Record<string, unknown>[], preferredColumns?: string[]): string => {
    if (rows.length === 0) {
      // Still emit just the header line if columns are known, otherwise an empty file.
      return preferredColumns ? preferredColumns.join(',') + '\r\n' : '';
    }
    // Compute column union across all rows, preserving preferred order first.
    const seen = new Set<string>();
    const columns: string[] = [];
    if (preferredColumns) {
      for (const col of preferredColumns) {
        if (!seen.has(col)) {
          seen.add(col);
          columns.push(col);
        }
      }
    }
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key)) {
          seen.add(key);
          columns.push(key);
        }
      }
    }
    const lines: string[] = [];
    lines.push(columns.join(','));
    for (const row of rows) {
      lines.push(columns.map((col) => escapeCsvCell(row[col])).join(','));
    }
    return lines.join('\r\n') + '\r\n';
  };

  const downloadCsvFile = (fileName: string, csvContent: string): { fileName: string; bytes: number } => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Downloads are only available in the browser environment.');
    }
    // Prepend BOM for Excel UTF-8 compatibility (Hebrew/special chars).
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    if (blob.size === 0) {
      throw new Error('Generated CSV is empty (0 bytes). Aborting download.');
    }
    const downloadUrl = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = fileName;
      anchor.rel = 'noopener';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      const dispatched = anchor.dispatchEvent(clickEvent);
      anchor.remove();
      if (!dispatched) {
        throw new Error('Browser blocked the automatic download. Check pop-up/download permissions.');
      }
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
    }
    return { fileName, bytes: blob.size };
  };

  const handleExportTransactionsCsv = async () => {
    if (!user || !isContextSet) {
      toast.error('Select a personal or client context before exporting');
      return;
    }
    setIsExportingTransactionsCsv(true);
    try {
      const payload = await buildExportPayload();
      const rows = payload.data.transactions as unknown as Record<string, unknown>[];
      const preferred = [
        'date', 'ticker', 'asset_name', 'asset_type', 'transaction_type',
        'quantity', 'price_per_unit', 'fees', 'currency',
        'cost_local', 'cost_base', 'base_currency', 'fx_rate_at_entry',
        'cash_impact_currency', 'cash_impact_amount',
        'realized_pl_base', 'realized_fx_pl', 'geography', 'inception_year',
        'linked_company_id', 'client_id', 'id', 'created_at', 'updated_at',
      ];
      const csv = rowsToCsv(rows, preferred);
      const result = downloadCsvFile('sufox_transactions.csv', csv);
      toast.success(`Transactions CSV saved (${rows.length} rows, ${formatBytes(result.bytes)})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export transactions CSV';
      toast.error(message);
    } finally {
      setIsExportingTransactionsCsv(false);
    }
  };

  const handleExportValuationsCsv = async () => {
    if (!user || !isContextSet) {
      toast.error('Select a personal or client context before exporting');
      return;
    }
    setIsExportingValuationsCsv(true);
    try {
      const payload = await buildExportPayload();
      const rows = payload.data.value_data as unknown as Record<string, unknown>[];
      const preferred = [
        'month', 'ticker', 'asset_name', 'asset_id', 'price_per_unit',
        'fx_rate', 'yield_to_maturity', 'coupon_rate', 'duration',
        'accrued_interest', 'maturity_date', 'linked_company_id',
        'client_id', 'id', 'created_at', 'updated_at',
      ];
      const csv = rowsToCsv(rows, preferred);
      const result = downloadCsvFile('sufox_monthly_valuations.csv', csv);
      toast.success(`Monthly Valuations CSV saved (${rows.length} rows, ${formatBytes(result.bytes)})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export valuations CSV';
      toast.error(message);
    } finally {
      setIsExportingValuationsCsv(false);
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);

    try {
      await runDownload('Export', 'sufox_data_export.json', async () => buildExportPayload());
    } catch {
      // already surfaced via runDownload
    } finally {
      setIsExportingData(false);
    }
  };

  return (
    <div className="section-spacing animate-fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-border pb-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Configure portfolio and account preferences</p>
      </div>

      {/* ==================== ACCOUNT SECTION ==================== */}
      <SectionHeader icon={User} title="Account" />
      
      <div className="grid gap-4">
        {/* Profile Card */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription className="text-xs">Your public profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback className="bg-muted text-primary text-lg">
                  {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload
                </Button>
                <p className="text-xs text-muted-foreground">Max 2MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Display Name</Label>
              <div className="flex gap-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" className="h-9" />
                <Button size="sm" onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" /> Security
            </CardTitle>
            <CardDescription className="text-xs">Manage your email and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <p className="text-xs text-muted-foreground">Current: {user?.email}</p>
              <div className="flex gap-2">
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" className="h-9" />
                <Button size="sm" onClick={handleUpdateEmail} disabled={isUpdatingEmail || !newEmail}>
                  {isUpdatingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                </Button>
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-border">
              <Label className="text-xs">Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="h-9" />
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="h-9" />
              <Button size="sm" onClick={handleUpdatePassword} disabled={isUpdatingPassword || !newPassword || !confirmPassword}>
                {isUpdatingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Card */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate('/auth'); }}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ==================== PORTFOLIO SECTION ==================== */}
      <SectionHeader icon={TrendingUp} title="Portfolio" />
      
      <div className="grid gap-4">
        {/* Risk Parameters */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risk Parameters</CardTitle>
            <CardDescription className="text-xs">Configure risk-free rate and benchmark for calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Risk-Free Rate (%)</Label>
                <Input type="number" step="0.1" value={riskFreeRate} onChange={(e) => setRiskFreeRate(e.target.value)} placeholder="4.5" className="h-9" />
                <p className="text-xs text-muted-foreground">Annual rate (e.g., 10Y Treasury)</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Base Currency</Label>
                <Select value={baseCurrency} onValueChange={(v: Currency) => setBaseCurrency(v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Reporting currency</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Benchmark Monthly Returns (%)</Label>
              <Textarea value={benchmarkReturns} onChange={(e) => setBenchmarkReturns(e.target.value)} placeholder="1.2, 0.8, -0.5, 2.1, 1.5..." rows={2} className="text-sm" />
              <p className="text-xs text-muted-foreground">Comma-separated monthly returns for Beta calculation</p>
            </div>
            <Button size="sm" onClick={handleSave} className="gradient-gold text-primary-foreground">
              <Save className="h-4 w-4 mr-2" /> Save Parameters
            </Button>
          </CardContent>
        </Card>

        {/* Sample Data */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DatabaseIcon className="h-4 w-4" /> Sample Data Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">{sampleDataMode ? 'Sample Data Active' : 'Your Data Active'}</p>
                <p className="text-xs text-muted-foreground">
                  {sampleDataMode ? 'Demo portfolio with equities, bonds & crypto' : 'Your personal portfolio data'}
                </p>
              </div>
              <Switch checked={sampleDataMode} onCheckedChange={handleSampleDataToggle} className="data-[state=checked]:bg-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Summary {sampleDataMode && <span className="text-xs text-primary ml-2">(Sample)</span>}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{transactions.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{valuations.length}</p>
                <p className="text-xs text-muted-foreground">Valuations</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{new Set(transactions.map(t => t.ticker)).size}</p>
                <p className="text-xs text-muted-foreground">Assets</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reload
              </Button>
              <Button variant="outline" size="sm" onClick={refreshMetrics}>
                <RefreshCw className="h-4 w-4 mr-2" /> Recalculate
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearData} disabled={sampleDataMode}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== INTEGRATIONS SECTION ==================== */}
      <SectionHeader icon={Calendar} title="Integrations" />
      
      <div className="grid gap-4">
        {/* Calendar */}
        <CalendarSettingsSection />

        {/* News Ticker */}
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Rss className="h-4 w-4" /> News Ticker
            </CardTitle>
            <CardDescription className="text-xs">RSS feed for the Overview page ticker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input type="url" value={rssFeedUrl} onChange={(e) => setRssFeedUrl(e.target.value)} placeholder="https://feeds.reuters.com/..." className="h-9" />
              <Button size="sm" onClick={handleSaveRssFeed} disabled={isSavingRss}>
                {isSavingRss ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Leave empty to disable the ticker</p>
          </CardContent>
        </Card>
      </div>

      {/* ==================== NOTIFICATIONS SECTION ==================== */}
      <SectionHeader icon={Bell} title="Notifications" />
      
      <Card className="bg-card/50">
        <CardContent className="pt-4">
          <NotificationSettings />
        </CardContent>
      </Card>

      {/* ==================== DATA MANAGEMENT SECTION ==================== */}
      <SectionHeader icon={DatabaseIcon} title="Data Management" />
      
      <div className="grid gap-4">
        {/* Data Cleanup */}
        <DataCleanupSection />

        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DatabaseIcon className="h-4 w-4" /> Data Export
            </CardTitle>
            <CardDescription className="text-xs">
              Export only your exact Analyses, Value Data, and Transactions for the active context as a migration-ready JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">Scope: Active context only</p>
              <p className="text-xs text-muted-foreground">
                Includes analysis companies, linked research entries, valuations, and transactions. Excludes settings, logs, UI state, and unrelated system data.
              </p>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <DatabaseIcon className="h-4 w-4 text-primary flex-shrink-0" />
                The file will be saved directly to your browser's <span className="font-mono text-foreground">Downloads</span> folder.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handlePreviewExport} disabled={isPreviewingExport || isExportingData || !user || !isContextSet} variant="outline" className="sm:flex-1">
                {isPreviewingExport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DatabaseIcon className="h-4 w-4 mr-2" />}
                Preview Export
              </Button>
              <Button onClick={handleExportData} disabled={isPreviewingExport || isExportingData || !user || !isContextSet} className="gradient-gold text-primary-foreground sm:flex-1">
                {isExportingData ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DatabaseIcon className="h-4 w-4 mr-2" />}
                Export JSON
              </Button>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/30 p-3 space-y-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  CSV Spreadsheets
                </p>
                <p className="text-xs text-muted-foreground">
                  Download Transactions or Monthly Valuations as a spreadsheet (opens in Excel, Numbers, Google Sheets).
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleExportTransactionsCsv}
                  disabled={isExportingTransactionsCsv || isExportingValuationsCsv || !user || !isContextSet}
                  variant="outline"
                  className="sm:flex-1"
                >
                  {isExportingTransactionsCsv ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                  Transactions CSV
                </Button>
                <Button
                  onClick={handleExportValuationsCsv}
                  disabled={isExportingTransactionsCsv || isExportingValuationsCsv || !user || !isContextSet}
                  variant="outline"
                  className="sm:flex-1"
                >
                  {isExportingValuationsCsv ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                  Monthly Valuations CSV
                </Button>
              </div>
            </div>
            {downloadProgress && (
              <DownloadProgressPanel
                progress={downloadProgress}
                onDismiss={() => setDownloadProgress(null)}
              />
            )}
            {exportPreview && (
              <div className="space-y-3 rounded-lg border border-border/60 bg-card/30 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">Preview summary</p>
                  <p className="text-xs text-muted-foreground">Counts and basic identifiers only</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewList title="Analysis Companies" rows={exportPreview.analysesCompanies} />
                  <PreviewList title="Research Entries" rows={exportPreview.researchEntries} />
                  <PreviewList title="Decision Log" rows={exportPreview.decisions} />
                  <PreviewList title="Value Data" rows={exportPreview.valueData} />
                  <PreviewList title="Transactions" rows={exportPreview.transactions} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleDownloadPreview} disabled={isDownloadingPreview || isExportingData || isPreviewingExport} variant="outline">
                    {isDownloadingPreview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DatabaseIcon className="h-4 w-4 mr-2" />}
                    Download Preview
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Trash */}
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <button
              onClick={() => navigate('/trash')}
              className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Trash (Deleted Items)</p>
                  <p className="text-xs text-muted-foreground">View and restore deleted records (30-day retention)</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* ==================== HELP SECTION ==================== */}
      <SectionHeader icon={HelpCircle} title="Getting Started" />
      
      <Card className="bg-card/50">
        <CardContent className="pt-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium text-foreground">Add Transactions</p>
              <p className="text-xs text-muted-foreground">Record buy/sell with date, quantity, price, and fees</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium text-foreground">Add Monthly Valuations</p>
              <p className="text-xs text-muted-foreground">Record NAV or market price for each asset at month-end</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium text-foreground">Set Risk Parameters</p>
              <p className="text-xs text-muted-foreground">Configure risk-free rate and benchmark returns</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">4</span>
            <div>
              <p className="font-medium text-foreground">Review Analytics</p>
              <p className="text-xs text-muted-foreground">Dashboard auto-calculates P/L, Sharpe, VaR, and more</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================== LEGAL SECTION ==================== */}
      <SectionHeader icon={Scale} title="Legal" />
      
      <Card className="bg-card/50">
        <CardContent className="pt-4 space-y-2">
          <button onClick={() => navigate('/terms')} className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group text-left">
            <div>
              <p className="text-sm font-medium text-foreground">Terms of Service</p>
              <p className="text-xs text-muted-foreground">User agreement and service terms</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </button>
          <button onClick={() => navigate('/privacy')} className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group text-left">
            <div>
              <p className="text-sm font-medium text-foreground">Privacy Policy</p>
              <p className="text-xs text-muted-foreground">Data collection, usage, and protection</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </button>
          <button onClick={() => navigate('/disclaimer')} className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group text-left">
            <div>
              <p className="text-sm font-medium text-foreground">Legal Disclaimer</p>
              <p className="text-xs text-muted-foreground">Important legal notices</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </button>
        </CardContent>
      </Card>

      {/* ==================== DANGER ZONE ==================== */}
      <SectionHeader icon={AlertTriangle} title="Danger Zone" />
      
      <Card className="bg-card/50 border-destructive/30">
        <CardContent className="pt-4">
          <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="mt-3">
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
                          <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="mt-2" />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount} className="bg-destructive hover:bg-destructive/90">
                        {isDeletingAccount && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Delete Forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
