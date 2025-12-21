import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CompanyFile {
  id: string;
  company_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export function useCompanyFiles(companyId: string | null) {
  const { user } = useAuth();
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('company_files')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch files:', error);
    } else {
      setFiles((data as CompanyFile[]) || []);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Real-time subscription
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`company-files-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'company_files',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          setFiles(prev => [payload.new as CompanyFile, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'company_files',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          setFiles(prev => prev.filter(f => f.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const uploadFile = useCallback(async (file: File) => {
    if (!user || !companyId) return null;

    setUploading(true);
    const filePath = `${user.id}/${companyId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      console.error(uploadError);
      setUploading(false);
      return null;
    }

    const { data, error: dbError } = await supabase
      .from('company_files')
      .insert({
        company_id: companyId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      toast.error('Failed to save file record');
      console.error(dbError);
      setUploading(false);
      return null;
    }

    toast.success('File uploaded');
    setUploading(false);
    return data;
  }, [user, companyId]);

  const deleteFile = useCallback(async (fileId: string, filePath: string) => {
    const { error: storageError } = await supabase.storage
      .from('company-files')
      .remove([filePath]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
    }

    const { error } = await supabase
      .from('company_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      toast.error('Failed to delete file');
      console.error(error);
      return false;
    }

    toast.success('File deleted');
    return true;
  }, []);

  const getFileUrl = useCallback(async (filePath: string) => {
    const { data } = await supabase.storage
      .from('company-files')
      .createSignedUrl(filePath, 3600);
    
    return data?.signedUrl;
  }, []);

  return {
    files,
    loading,
    uploading,
    fetchFiles,
    uploadFile,
    deleteFile,
    getFileUrl,
  };
}
