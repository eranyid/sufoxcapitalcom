import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search } from 'lucide-react';

interface UserOption {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (participantIds: string[], name?: string, type?: 'direct' | 'group') => void;
}

export function NewConversationDialog({ open, onOpenChange, onCreateConversation }: NewConversationDialogProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .neq('id', user?.id || '')
        .eq('is_approved', true);
      setUsers(data || []);
    };
    fetchUsers();
    setSelectedUsers([]);
    setGroupName('');
    setSearch('');
  }, [open, user]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.display_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
  });

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;
    const type = selectedUsers.length > 1 ? 'group' : 'direct';
    onCreateConversation(selectedUsers, type === 'group' ? groupName || undefined : undefined, type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider">NEW CONVERSATION</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {selectedUsers.length > 1 && (
            <div>
              <Label className="text-xs text-muted-foreground">Group Name (optional)</Label>
              <Input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Investment Committee"
                className="h-8 text-xs mt-1"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 border border-border rounded-md p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">No users found</p>
            )}
            {filtered.map(u => (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors"
              >
                <Checkbox checked={selectedUsers.includes(u.id)} />
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px] bg-muted font-mono">
                    {(u.display_name || u.email || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-xs font-medium">{u.display_name || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
              </button>
            ))}
          </div>

          <Button onClick={handleCreate} disabled={selectedUsers.length === 0} className="w-full h-8 text-xs">
            {selectedUsers.length > 1 ? 'Create Group' : 'Start Conversation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
