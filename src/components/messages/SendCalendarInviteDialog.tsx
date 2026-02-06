import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CalendarPlus, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SendCalendarInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendInvite: (analysisId: string, analysisType: string, analysisTitle: string, snapshot?: Record<string, unknown>) => Promise<void>;
}

export function SendCalendarInviteDialog({ open, onOpenChange, onSendInvite }: SendCalendarInviteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);

    try {
      const startAt = isAllDay
        ? `${date}T00:00:00`
        : `${date}T${startTime}:00`;
      const endAt = isAllDay
        ? `${date}T23:59:59`
        : `${date}T${endTime}:00`;

      // Create internal calendar event
      const { data: event, error } = await supabase
        .from('internal_events')
        .insert({
          user_id: user.id,
          title: title.trim(),
          start_at: startAt,
          end_at: endAt,
          is_all_day: isAllDay,
          location: location.trim() || null,
          description: description.trim() || null,
          color: '#F97316',
        })
        .select()
        .single();

      if (error) throw error;

      // Send as message
      const displayDate = format(new Date(startAt), 'dd/MM/yyyy');
      const displayTime = isAllDay ? 'All day' : `${startTime} – ${endTime}`;

      await onSendInvite(
        event.id,
        'calendar_event',
        title.trim(),
        {
          date: displayDate,
          time: displayTime,
          location: location.trim() || null,
          description: description.trim() || null,
          start_at: startAt,
          end_at: endAt,
          is_all_day: isAllDay,
        }
      );

      toast({ title: 'Event created & shared' });

      // Reset form
      setTitle('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setStartTime('10:00');
      setEndTime('11:00');
      setLocation('');
      setDescription('');
      setIsAllDay(false);
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider flex items-center gap-2">
            <CalendarPlus size={14} className="text-primary" />
            SEND CALENDAR INVITE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase">Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Meeting title..."
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground uppercase">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-8 text-xs mt-1"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground uppercase">All Day</Label>
            <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Clock size={8} /> Start
                </Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <Clock size={8} /> End
                </Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <MapPin size={8} /> Location
            </Label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Optional..."
              className="h-8 text-xs mt-1"
            />
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground uppercase">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional..."
              className="text-xs mt-1 min-h-[60px] resize-none"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!title.trim() || saving}
            className="w-full h-8 text-xs gap-1.5"
          >
            <CalendarPlus size={12} />
            {saving ? 'Creating...' : 'Create & Send Invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
