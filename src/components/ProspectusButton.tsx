import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ProspectusButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ProspectusButton({ variant = 'outline', size = 'sm', className = '' }: ProspectusButtonProps) {
  const { user } = useAuth();
  const [prospectusPath, setProspectusPath] = useState<string | null>(null);
  const [prospectusBlob, setProspectusBlob] = useState<string | null>(null);
  const [isProspectusOpen, setIsProspectusOpen] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Load prospectus path on mount
  useEffect(() => {
    const loadProspectus = async () => {
      if (!user) return;
      
      const { data } = await supabase.storage
        .from('policy-documents')
        .list(user.id, { limit: 1, search: 'prospectus' });
      
      if (data && data.length > 0) {
        setProspectusPath(`${user.id}/${data[0].name}`);
      }
    };
    loadProspectus();
  }, [user]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (prospectusBlob) {
        URL.revokeObjectURL(prospectusBlob);
      }
    };
  }, [prospectusBlob]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setPdfScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setPdfScale(prev => Math.max(prev - 0.25, 0.5));

  const openProspectus = async () => {
    if (!prospectusPath) {
      toast.error('No prospectus uploaded. Go to Investment Policy to upload.');
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

  if (!prospectusPath) {
    return null; // Don't show button if no prospectus uploaded
  }

  return (
    <>
      <Button 
        onClick={openProspectus}
        variant={variant}
        size={size}
        className={`gap-1.5 font-mono text-[10px] uppercase tracking-wider ${className}`}
      >
        <FileText className="h-3 w-3" />
        <span>Prospectus</span>
      </Button>

      <Dialog open={isProspectusOpen} onOpenChange={setIsProspectusOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
              <h2 className="text-lg font-semibold text-primary">Prospectus</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsProspectusOpen(false)}
                className="h-10 w-10 rounded-full border-primary/50 hover:bg-primary/10"
              >
                <X className="h-5 w-5" />
              </Button>
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
    </>
  );
}