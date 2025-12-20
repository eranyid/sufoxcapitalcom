import { useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Upload, FileText, File, Image, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskFiles, TaskFile } from '@/hooks/useTaskFiles';

interface Props {
  taskId: string;
}

export function TaskFilesTab({ taskId }: Props) {
  const { files, loading, uploading, fetchFiles, uploadFile, deleteFile, getFileUrl } = useTaskFiles(taskId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = e.dataTransfer.files;
    for (const file of Array.from(droppedFiles)) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDownload = async (file: TaskFile) => {
    const url = await getFileUrl(file.file_path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (contentType: string | null) => {
    if (contentType?.startsWith('image/')) return Image;
    if (contentType?.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Upload Section */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="m-4 p-6 border-2 border-dashed border-border rounded-lg text-center hover:border-primary/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload size={24} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop files here, or
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-14 bg-muted/30 animate-pulse rounded" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <FileText size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-muted-foreground">No files attached</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Upload files to attach them to this task
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => {
              const Icon = getFileIcon(file.content_type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/50 group"
                >
                  <div className="w-10 h-10 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} · {format(new Date(file.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(file)}
                    >
                      <Download size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFile(file.id, file.file_path)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
