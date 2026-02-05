import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Save, FileText, Scale, Loader2, Upload, X, Trash2, RefreshCw, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Target, MapPin, PieChart, ArrowRight, Sparkles, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Document, Page, pdfjs } from 'react-pdf';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { useNavigate } from 'react-router-dom';
import { PolicyTargetAllocationTable } from '@/components/policy/PolicyTargetAllocationTable';
import { OBJECTIVE_LABELS, RISK_LABELS } from '@/types/construction';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PolicyFormData {
  strategy_philosophy: string;
  special_constraints: string;
}

const defaultPolicy: PolicyFormData = {
  strategy_philosophy: '',
  special_constraints: '',
};

const HORIZON_LABELS: Record<string, string> = {
  short_term: '1-3 Years',
  medium_term: '3-7 Years',
  long_term: '7+ Years',
};

const GEO_LABELS: Record<string, string> = {
  israel: 'Israel',
  usa: 'USA',
  europe: 'Europe',
  other: 'Other',
};

const ASSET_CLASS_LABELS: Record<string, string> = {
  equities: 'Equities',
  bonds: 'Bonds',
  hedging: 'Hedging',
  alternatives: 'Alternatives',
  cash: 'Cash',
};

const ASSET_CLASS_COLORS: Record<string, string> = {
  equities: 'bg-primary',
  bonds: 'bg-blue-500',
  hedging: 'bg-amber-500',
  alternatives: 'bg-purple-500',
  cash: 'bg-emerald-500',
};

export default function InvestmentPolicy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyFormData>(defaultPolicy);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingPolicy, setHasExistingPolicy] = useState(false);
  const [prospectusPath, setProspectusPath] = useState<string | null>(null);
  const [prospectusBlob, setProspectusBlob] = useState<string | null>(null);
  const [isUploadingProspectus, setIsUploadingProspectus] = useState(false);
  const [isProspectusOpen, setIsProspectusOpen] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isDeletingProspectus, setIsDeletingProspectus] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const { activeTarget, targetLines, isLoading: isLoadingTarget } = useTargetAllocation();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setPdfScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setPdfScale(prev => Math.max(prev - 0.25, 0.5));

  useEffect(() => {
    if (user) {
      loadPolicy();
      loadProspectus();
    }
  }, [user]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (prospectusBlob) {
        URL.revokeObjectURL(prospectusBlob);
      }
    };
  }, [prospectusBlob]);

  const loadProspectus = async () => {
    if (!user) return;
    
    const { data } = await supabase.storage
      .from('policy-documents')
      .list(user.id, { limit: 1, search: 'prospectus' });
    
    if (data && data.length > 0) {
      setProspectusPath(`${user.id}/${data[0].name}`);
    }
  };

  const handleProspectusUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploadingProspectus(true);
    try {
      const { data: existingFiles } = await supabase.storage
        .from('policy-documents')
        .list(user.id, { search: 'prospectus' });
      
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('policy-documents')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const fileName = `prospectus_${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from('policy-documents')
        .upload(`${user.id}/${fileName}`, file);

      if (error) throw error;

      setProspectusPath(`${user.id}/${fileName}`);
      toast.success('Prospectus uploaded successfully');
    } catch (error) {
      console.error('Error uploading prospectus:', error);
      toast.error('Failed to upload prospectus');
    } finally {
      setIsUploadingProspectus(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openProspectus = async () => {
    if (!prospectusPath) {
      toast.error('No prospectus found');
      return;
    }
    
    setIsProspectusOpen(true);
    setIsLoadingPdf(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('policy-documents')
        .download(prospectusPath);
      
      if (error) throw error;
      if (!data) throw new Error('No data received');
      
      if (prospectusBlob) {
        URL.revokeObjectURL(prospectusBlob);
      }
      
      const blobUrl = URL.createObjectURL(data);
      setProspectusBlob(blobUrl);
    } catch (error) {
      console.error('Error loading prospectus:', error);
      toast.error('Failed to load prospectus');
      setIsProspectusOpen(false);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleDeleteProspectus = async () => {
    if (!user || !prospectusPath) return;
    
    setIsDeletingProspectus(true);
    try {
      const { error } = await supabase.storage
        .from('policy-documents')
        .remove([prospectusPath]);
      
      if (error) throw error;
      
      if (prospectusBlob) {
        URL.revokeObjectURL(prospectusBlob);
      }
      setProspectusPath(null);
      setProspectusBlob(null);
      setIsProspectusOpen(false);
      toast.success('Prospectus deleted');
    } catch (error) {
      console.error('Error deleting prospectus:', error);
      toast.error('Failed to delete prospectus');
    } finally {
      setIsDeletingProspectus(false);
    }
  };

  const handleReplaceProspectus = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsLoadingPdf(true);
    try {
      if (prospectusPath) {
        await supabase.storage
          .from('policy-documents')
          .remove([prospectusPath]);
      }

      const fileName = `prospectus_${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from('policy-documents')
        .upload(`${user.id}/${fileName}`, file);

      if (error) throw error;

      const newPath = `${user.id}/${fileName}`;
      setProspectusPath(newPath);

      const { data, error: downloadError } = await supabase.storage
        .from('policy-documents')
        .download(newPath);
      
      if (downloadError) throw downloadError;

      if (prospectusBlob) {
        URL.revokeObjectURL(prospectusBlob);
      }

      const blobUrl = URL.createObjectURL(data);
      setProspectusBlob(blobUrl);
      toast.success('Prospectus replaced successfully');
    } catch (error) {
      console.error('Error replacing prospectus:', error);
      toast.error('Failed to replace prospectus');
    } finally {
      setIsLoadingPdf(false);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  const loadPolicy = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_policies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasExistingPolicy(true);
        setPolicy({
          strategy_philosophy: data.strategy_philosophy || '',
          special_constraints: data.special_constraints || '',
        });
      }
    } catch (error) {
      console.error('Error loading policy:', error);
      toast.error('Failed to load investment policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        strategy_philosophy: policy.strategy_philosophy,
        special_constraints: policy.special_constraints,
      };

      let error;
      if (hasExistingPolicy) {
        const result = await supabase
          .from('investment_policies')
          .update(payload as any)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('investment_policies')
          .insert(payload as any);
        error = result.error;
        if (!error) setHasExistingPolicy(true);
      }

      if (error) throw error;
      toast.success('Investment policy saved');
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Failed to save investment policy');
    } finally {
      setIsSaving(false);
    }
  };

  // Parse target lines into geography and asset class maps
  const geographyData = targetLines
    .filter(l => l.dimension_type === 'geography')
    .reduce((acc, l) => ({ ...acc, [l.key]: l.target_weight }), {} as Record<string, number>);
    
  const assetClassData = targetLines
    .filter(l => l.dimension_type === 'asset_class')
    .reduce((acc, l) => ({ ...acc, [l.key]: l.target_weight }), {} as Record<string, number>);

  const bucketsData = targetLines
    .filter(l => l.dimension_type === 'bucket')
    .map(l => ({
      key: l.key,
      label: (l.metadata_json?.label as string) || l.key,
      weight: l.target_weight,
      implementation: l.metadata_json?.implementation as string,
    }));

  if (isLoading || isLoadingTarget) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-spacing animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide">Investment Policy</h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">Define your strategy, constraints & compliance rules</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            onChange={handleProspectusUpload}
            className="hidden"
          />
          {prospectusPath ? (
            <Button
              variant="outline"
              onClick={openProspectus}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <FileText className="h-4 w-4 mr-2" />
              Prospectus
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingProspectus}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              {isUploadingProspectus ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Prospectus
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gradient-gold text-primary-foreground">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Policy
          </Button>
        </div>
      </div>

      {/* Strategy & Philosophy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Strategy & Philosophy
          </CardTitle>
          <CardDescription>
            Describe your investment philosophy, long-term goals, approach to risk, and overall strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={policy.strategy_philosophy}
            onChange={(e) => setPolicy(prev => ({ ...prev, strategy_philosophy: e.target.value }))}
            placeholder="Example: Long-term value investor focused on quality companies with strong moats. I prefer a balanced portfolio with 60-70% equities, moderate fixed income exposure, and limited alternatives. I avoid highly speculative positions and prioritize capital preservation over aggressive growth. Willing to accept short-term volatility for long-term returns..."
            className="min-h-[200px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Special Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Special Constraints
          </CardTitle>
          <CardDescription>
            Any additional rules, exclusions, or requirements (e.g., no crypto, ESG requirements, no small caps, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={policy.special_constraints}
            onChange={(e) => setPolicy(prev => ({ ...prev, special_constraints: e.target.value }))}
            placeholder="Example: No cryptocurrency positions. Avoid tobacco and weapons manufacturers. Prefer companies with strong ESG scores. Minimum market cap $1B for individual stocks..."
            className="min-h-[100px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Manual Target Allocation */}
      <PolicyTargetAllocationTable />

      {/* Target Allocation Summary */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Target Allocation
              </CardTitle>
              <CardDescription>
                {activeTarget ? `Active: ${activeTarget.name}` : 'No target allocation configured'}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/construction')}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              {activeTarget ? 'Edit' : 'Configure'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activeTarget ? (
            <div className="space-y-6">
              {/* Overview Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <Sparkles className="h-3 w-3" />
                  {OBJECTIVE_LABELS[activeTarget.objective as keyof typeof OBJECTIVE_LABELS] || activeTarget.objective}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <Target className="h-3 w-3" />
                  {RISK_LABELS[activeTarget.risk_level as keyof typeof RISK_LABELS] || activeTarget.risk_level} Risk
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  {HORIZON_LABELS[activeTarget.horizon] || activeTarget.horizon}
                </Badge>
              </div>

              <Separator />

              {/* Asset Class Allocation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Asset Allocation</Label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {Object.entries(assetClassData).map(([key, weight]) => (
                    <div key={key} className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{ASSET_CLASS_LABELS[key] || key}</span>
                        <span className="font-mono text-lg font-semibold text-foreground">{weight}%</span>
                      </div>
                      <Progress 
                        value={weight} 
                        className={cn("h-1.5", ASSET_CLASS_COLORS[key])}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Geographic Allocation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Geographic Allocation</Label>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(geographyData).map(([key, weight]) => (
                    <div key={key} className="p-4 rounded-xl bg-card border border-border/50 text-center">
                      <span className="text-xs text-muted-foreground block mb-1">{GEO_LABELS[key] || key}</span>
                      <span className="font-mono text-2xl font-semibold text-foreground">{weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buckets (if any) */}
              {bucketsData.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Implementation Buckets</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {bucketsData.map((bucket) => (
                        <div key={bucket.key} className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground truncate">{bucket.label}</span>
                            <span className="font-mono text-sm font-semibold text-primary">{bucket.weight}%</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground capitalize">{bucket.implementation?.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-sm font-semibold mb-2">No Target Allocation</h3>
              <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-4">
                Create a target allocation using the Portfolio Construction wizard to define your investment structure.
              </p>
              <Button onClick={() => navigate('/construction')} className="gap-2">
                Configure Target
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gradient-gold text-primary-foreground">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Investment Policy
        </Button>
      </div>

      {/* Prospectus PDF Viewer Modal */}
      <Dialog open={isProspectusOpen} onOpenChange={setIsProspectusOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
              <h2 className="text-lg font-semibold text-primary">Prospectus</h2>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  accept=".pdf"
                  onChange={handleReplaceProspectus}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => replaceFileInputRef.current?.click()}
                  disabled={isLoadingPdf}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeletingProspectus}
                      className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      {isDeletingProspectus ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Prospectus?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The prospectus file will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProspectus}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsProspectusOpen(false)}
                  className="h-10 w-10 rounded-full border-primary/50 hover:bg-primary/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* PDF Toolbar */}
            <div className="flex items-center justify-center gap-4 py-2 border-b border-border bg-muted/50">
              <Button variant="ghost" size="sm" onClick={zoomOut} disabled={pdfScale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{Math.round(pdfScale * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={zoomIn} disabled={pdfScale >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {numPages || '?'}
              </span>
              <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={currentPage >= numPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <a
                href={prospectusBlob || '#'}
                download="prospectus.pdf"
                className={!prospectusBlob ? 'pointer-events-none opacity-50' : ''}
              >
                <Button variant="ghost" size="sm" disabled={!prospectusBlob}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
            </div>
            
            {/* PDF Content */}
            <div ref={pdfContainerRef} className="flex-1 w-full overflow-auto bg-muted/30 flex justify-center py-4">
              {isLoadingPdf ? (
                <div className="flex flex-col items-center gap-4 pt-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              ) : prospectusBlob ? (
                <Document
                  file={prospectusBlob}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex flex-col items-center gap-4 pt-20">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-muted-foreground">Rendering PDF...</p>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center gap-4 text-muted-foreground pt-20">
                      <FileText className="h-12 w-12" />
                      <p>Failed to load PDF</p>
                    </div>
                  }
                >
                  <Page 
                    pageNumber={currentPage} 
                    scale={pdfScale}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    }
                  />
                </Document>
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground pt-20">
                  <FileText className="h-12 w-12" />
                  <p>No PDF loaded</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
