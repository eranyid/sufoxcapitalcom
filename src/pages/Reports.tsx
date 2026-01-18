import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Copy, Trash2, Edit3, Calendar, Mail, Send, Loader2 } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateWYSIWYGReportPDF } from '@/lib/reportPdfGenerator';
import type { Report, ReportBranding as OldReportBranding } from '@/types/reports';
import { DEFAULT_BRANDING as WYSIWYG_DEFAULT_BRANDING } from '@/types/reportBuilder';
import type { ReportBranding as WYSIWYGBranding } from '@/types/reportBuilder';

export default function Reports() {
  const navigate = useNavigate();
  const { reports, loading, createReport, deleteReport, duplicateReport } = useReports();
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailReport, setEmailReport] = useState<Report | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const reportToDelete = deleteId ? reports.find(r => r.id === deleteId) : null;

  const filteredReports = reports.filter(r => {
    const query = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(query) || 
           (r.description && r.description.toLowerCase().includes(query));
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const report = await createReport(newName.trim(), newDescription.trim() || undefined);
    if (report) {
      setCreateOpen(false);
      setNewName('');
      setNewDescription('');
      navigate(`/reports/${report.id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteReport(deleteId);
    setDeleteId(null);
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateReport(id);
  };

  const openEmailDialog = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmailReport(report);
    setEmailTo('');
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailReport || !emailTo.trim()) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTo)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    
    try {
      // Merge old branding format with WYSIWYG defaults
      const mergedBranding: WYSIWYGBranding = {
        ...WYSIWYG_DEFAULT_BRANDING,
        logoUrl: emailReport.branding.logoUrl,
        accentColor: emailReport.branding.accentColor || WYSIWYG_DEFAULT_BRANDING.accentColor,
        headerTitle: emailReport.branding.headerTitle || emailReport.name,
        headerSubtitle: emailReport.branding.headerSubtitle,
        footerText: emailReport.branding.footerText,
        analystName: emailReport.branding.analystName,
        showPageNumbers: emailReport.branding.showPageNumbers ?? true,
      };
      
      // Generate PDF as base64 with minimal blocks for simple report
      const pdfBase64 = await generateWYSIWYGReportPDF({
        blocks: [], // Empty blocks - the function will handle it
        branding: mergedBranding,
        pageSize: emailReport.page_size,
        reportName: emailReport.name,
        returnAsBase64: true,
      });

      if (!pdfBase64 || typeof pdfBase64 !== 'string') {
        throw new Error('Failed to generate PDF');
      }

      // Send via edge function
      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: {
          to: emailTo.trim(),
          reportName: emailReport.name,
          pdfBase64: pdfBase64,
        },
      });

      if (error) throw error;

      toast.success(`Report sent to ${emailTo}`);
      setEmailDialogOpen(false);
      setEmailReport(null);
      setEmailTo('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-foreground/70 mt-1">
            Build and export custom investment reports
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
          <Plus size={16} />
          New Report
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Reports Table or Empty State */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium">No reports yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first report to build custom PDF exports.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-6 gap-2">
            <Plus size={16} />
            New Report
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border/60 overflow-hidden bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                <TableHead className="font-medium text-xs uppercase tracking-wide text-foreground/80">Name</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wide text-foreground/80 w-[140px]">Last Updated</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wide text-foreground/80 w-[100px]">Page Size</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map(report => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer group transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {report.name}
                        </span>
                        {report.description && (
                          <p className="text-xs text-foreground/60 truncate max-w-md mt-0.5">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <Calendar size={12} />
                      <span className="font-mono text-xs">
                        {format(new Date(report.updated_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs font-mono text-foreground/70">
                      {report.page_size}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/60 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reports/${report.id}`);
                        }}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/60 hover:text-primary"
                        onClick={(e) => openEmailDialog(report, e)}
                        title="Send via Email"
                      >
                        <Mail size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/60 hover:text-primary"
                        onClick={(e) => handleDuplicate(report.id, e)}
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/60 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(report.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="Q4 Investor Update"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-desc">Description (optional)</Label>
              <Textarea
                id="report-desc"
                placeholder="Brief description of this report..."
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail size={18} />
              Send Report via Email
            </DialogTitle>
            <DialogDescription>
              Send "{emailReport?.name}" as a PDF attachment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">Recipient Email</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                disabled={sendingEmail}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={sendingEmail}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={!emailTo.trim() || sendingEmail} className="gap-2">
              {sendingEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{reportToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
