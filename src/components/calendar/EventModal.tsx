import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trash2, MapPin, Repeat, Bell, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarEvent, InternalEventInput } from '@/hooks/useCalendarEvents';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  onSave: (input: InternalEventInput) => void;
  onDelete?: (id: string) => void;
  isSaving?: boolean;
}

const EVENT_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'No reminder' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export function EventModal({
  open,
  onClose,
  event,
  defaultDate,
  onSave,
  onDelete,
  isSaving
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);
  const [color, setColor] = useState('#3b82f6');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isGoogleEvent = event?.source === 'google';
  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(format(event.start, 'yyyy-MM-dd'));
      setStartTime(format(event.start, 'HH:mm'));
      setEndDate(format(event.end, 'yyyy-MM-dd'));
      setEndTime(format(event.end, 'HH:mm'));
      setLocation(event.location || '');
      setIsAllDay(event.isAllDay || false);
      setRecurrenceType(event.recurrenceType || 'none');
      setRecurrenceEndDate(event.recurrenceEndDate ? format(event.recurrenceEndDate, 'yyyy-MM-dd') : '');
      setReminderMinutes(event.reminderMinutes || 0);
      setColor(event.color || '#3b82f6');
    } else if (defaultDate) {
      const start = defaultDate;
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
      setTitle('');
      setDescription('');
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setLocation('');
      setIsAllDay(false);
      setRecurrenceType('none');
      setRecurrenceEndDate('');
      setReminderMinutes(0);
      setColor('#3b82f6');
    }
  }, [event, defaultDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isGoogleEvent) return;

    const startAt = isAllDay 
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`);
    const endAt = isAllDay 
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}`);

    if (endAt <= startAt && !isAllDay) {
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      location: location.trim() || undefined,
      is_all_day: isAllDay,
      recurrence_type: recurrenceType as InternalEventInput['recurrence_type'],
      recurrence_end_date: recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString() : undefined,
      reminder_minutes: reminderMinutes || undefined,
      color,
    });
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (isGoogleEvent ? 'Event Details' : 'Edit Event') : 'New Event'}
              {isGoogleEvent && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-[10px]">
                  Google
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title with color indicator */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  disabled={isGoogleEvent}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="all-day" className="cursor-pointer">All Day</Label>
              <Switch
                id="all-day"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
                disabled={isGoogleEvent}
              />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isGoogleEvent}
                  required
                />
              </div>
              {!isAllDay && (
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isGoogleEvent}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isGoogleEvent}
                  required
                />
              </div>
              {!isAllDay && (
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isGoogleEvent}
                    required
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin size={14} />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location..."
                disabled={isGoogleEvent}
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Repeat size={14} />
                Repeat
              </Label>
              <Select 
                value={recurrenceType} 
                onValueChange={setRecurrenceType}
                disabled={isGoogleEvent}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {recurrenceType !== 'none' && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="recurrence-end">Repeat until</Label>
                  <Input
                    id="recurrence-end"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    disabled={isGoogleEvent}
                    min={endDate}
                  />
                </div>
              )}
            </div>

            {/* Reminder */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell size={14} />
                Reminder
              </Label>
              <Select 
                value={String(reminderMinutes)} 
                onValueChange={(v) => setReminderMinutes(Number(v))}
                disabled={isGoogleEvent}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette size={14} />
                Color
              </Label>
              <div className="flex gap-2">
                {EVENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => !isGoogleEvent && setColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c.value ? 'border-white scale-110' : 'border-transparent'
                    } ${isGoogleEvent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                    disabled={isGoogleEvent}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description..."
                rows={3}
                disabled={isGoogleEvent}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {isEditing && !isGoogleEvent && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {isGoogleEvent ? 'Close' : 'Cancel'}
                </Button>
                {!isGoogleEvent && (
                  <Button type="submit" disabled={isSaving || !title.trim()}>
                    {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event?.title}"? This action cannot be undone.
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
    </>
  );
}
