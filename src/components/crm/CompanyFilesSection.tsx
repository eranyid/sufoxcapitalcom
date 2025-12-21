import { useRef, useState } from 'react';
import { useCompanyFiles, FILE_CATEGORIES, FileCategory, CompanyFile } from '@/hooks/useCompanyFiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Upload, File, FileText, Image, Download, Trash2, Loader2, FolderOpen, Filter, Tag, X, GripVertical, Search, Cloud } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableFileItemProps {
  file: CompanyFile;
  isEditing: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  onStartEdit: () => void;
  onCategoryChange: (category: string) => void;
  onDownload: () => void;
  onDelete: () => void;
  getFileIcon: (contentType: string | null) => React.ComponentType<{ className?: string }>;
  formatFileSize: (bytes: number | null) => string;
}

function SortableFileItem({
  file,
  isEditing,
  isSelected,
  onToggleSelection,
  onStartEdit,
  onCategoryChange,
  onDownload,
  onDelete,
  getFileIcon,
  formatFileSize,
}: SortableFileItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const FileIcon = getFileIcon(file.content_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 group ${
        isSelected ? 'bg-primary/10' : ''
      } ${isDragging ? 'z-50 shadow-lg bg-card' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded shrink-0 touch-none"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelection}
        className="shrink-0"
      />
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
          onValueChange={onCategoryChange}
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
            onClick={onStartEdit}
            title="Change category"
          >
            <Tag className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onDownload}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function CompanyFilesSection({ companyId }: Props) {
  const { files, loading, uploading, uploadFile, deleteFile, updateFileCategory, reorderFiles, getFileUrl } = useCompanyFiles(companyId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('Other');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<FileCategory>('Other');
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFileIds(new Set());
  };

  const handleBulkDelete = async () => {
    const filesToDelete = files.filter(f => selectedFileIds.has(f.id));
    let deleted = 0;
    for (const file of filesToDelete) {
      const success = await deleteFile(file.id, file.file_path);
      if (success) deleted++;
    }
    toast.success(`Deleted ${deleted} file${deleted !== 1 ? 's' : ''}`);
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const handleBulkCategoryChange = async () => {
    let updated = 0;
    for (const fileId of selectedFileIds) {
      const success = await updateFileCategory(fileId, bulkCategory);
      if (success) updated++;
    }
    toast.success(`Updated ${updated} file${updated !== 1 ? 's' : ''}`);
    clearSelection();
    setBulkCategoryOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent, category: string, categoryFiles: CompanyFile[]) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = categoryFiles.findIndex(f => f.id === active.id);
      const newIndex = categoryFiles.findIndex(f => f.id === over.id);
      
      const newOrder = arrayMove(categoryFiles, oldIndex, newIndex);
      reorderFiles(category, newOrder.map(f => f.id));
    }
  };

  // Filter by category and search
  const filteredFiles = files.filter(f => {
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      f.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group files by category
  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const cat = file.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(file);
    return acc;
  }, {} as Record<string, typeof files>);

  const hasSelection = selectedFileIds.size > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen size={18} className="text-primary" />
            Files
            <Badge variant="outline" className="ml-1 text-xs gap-1">
              <Cloud size={10} />
              Cloud
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[150px] pl-8 text-xs"
              />
            </div>
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
        {/* Bulk Actions Bar */}
        {hasSelection && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-medium text-primary">
              {selectedFileIds.size} selected
            </span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={selectAll}
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => setBulkCategoryOpen(true)}
            >
              <Tag size={12} />
              Change Category
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 size={12} />
              Delete
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={clearSelection}
            >
              <X size={14} />
            </Button>
          </div>
        )}

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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, category, categoryFiles)}
                >
                  <SortableContext
                    items={categoryFiles.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1 pl-2 border-l-2 border-border">
                      {categoryFiles.map((file) => (
                        <SortableFileItem
                          key={file.id}
                          file={file}
                          isEditing={editingFileId === file.id}
                          isSelected={selectedFileIds.has(file.id)}
                          onToggleSelection={() => toggleFileSelection(file.id)}
                          onStartEdit={() => setEditingFileId(file.id)}
                          onCategoryChange={async (v) => {
                            await updateFileCategory(file.id, v);
                            setEditingFileId(null);
                          }}
                          onDownload={() => handleDownload(file.file_path)}
                          onDelete={() => deleteFile(file.id, file.file_path)}
                          getFileIcon={getFileIcon}
                          formatFileSize={formatFileSize}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedFileIds.size} file{selectedFileIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The files will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Category Change Dialog */}
      <Dialog open={bulkCategoryOpen} onOpenChange={setBulkCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change category for {selectedFileIds.size} file{selectedFileIds.size !== 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Category</label>
              <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(v as FileCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      <Badge variant="outline" className={`${CATEGORY_COLORS[cat]} text-xs`}>
                        {cat}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCategoryOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkCategoryChange}>
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
