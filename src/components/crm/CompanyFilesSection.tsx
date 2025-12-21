import { useRef, useState } from 'react';
import { useCompanyFiles, FILE_CATEGORIES, FileCategory } from '@/hooks/useCompanyFiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, File, FileText, Image, Download, Trash2, Loader2, FolderOpen, Filter, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  companyId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Earnings: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Reports: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Presentations: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Models: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Notes: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Contracts: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Other: 'bg-muted text-muted-foreground border-border',
};

export function CompanyFilesSection({ companyId }: Props) {
  const { files, loading, uploading, uploadFile, deleteFile, updateFileCategory, getFileUrl } = useCompanyFiles(companyId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('Other');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setPendingFiles(Array.from(selectedFiles));
    setUploadDialogOpen(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;
    
    setPendingFiles(Array.from(droppedFiles));
    setUploadDialogOpen(true);
  };

  const handleConfirmUpload = async () => {
    for (const file of pendingFiles) {
      await uploadFile(file, selectedCategory);
    }
    setPendingFiles([]);
    setSelectedCategory('Other');
    setUploadDialogOpen(false);
  };

  const handleCancelUpload = () => {
    setPendingFiles([]);
    setSelectedCategory('Other');
    setUploadDialogOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDownload = async (filePath: string) => {
    const url = await getFileUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (contentType: string | null) => {
    if (contentType?.startsWith('image/')) return Image;
    if (contentType?.includes('pdf') || contentType?.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredFiles = filterCategory === 'all' 
    ? files 
    : files.filter(f => f.category === filterCategory);

  // Group files by category
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const cat = file.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(file);
    return acc;
  }, {} as Record<string, typeof files>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen size={18} className="text-primary" />
            Files
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FILE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                >
                  browse
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Files list */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {filterCategory === 'all' ? 'No files attached yet' : `No ${filterCategory} files`}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}>
                    {category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {categoryFiles.length} file{categoryFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1 pl-2 border-l-2 border-border">
                  {categoryFiles.map((file) => {
                    const FileIcon = getFileIcon(file.content_type);
                    const isEditing = editingFileId === file.id;
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 group"
                      >
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {isEditing ? (
                          <Select 
                            value={file.category || 'Other'} 
                            onValueChange={async (v) => {
                              await updateFileCategory(file.id, v);
                              setEditingFileId(null);
                            }}
                          >
                            <SelectTrigger className="w-[120px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FILE_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingFileId(file.id)}
                              title="Change category"
                            >
                              <Tag className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDownload(file.file_path)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteFile(file.id, file.file_path)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog - Select Category */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as FileCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${CATEGORY_COLORS[cat]} text-xs`}>
                          {cat}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Files to upload:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="truncate">{f.name}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelUpload}>Cancel</Button>
            <Button onClick={handleConfirmUpload} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
