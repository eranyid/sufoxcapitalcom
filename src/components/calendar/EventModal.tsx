import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarEvent,
  EventCategory,
  LinkedModule,
  RecurrenceFrequency,
  CATEGORY_OPTIONS,
  LINKED_MODULE_OPTIONS,
  RECURRENCE_OPTIONS,
  WEEKDAY_OPTIONS,
} from '@/types/calendar';
import { format, parseISO, setHours, setMinutes, addHours } from 'date-fns';
import { Trash2 } from 'lucide-react';
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

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  defaultDate?: Date;
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<CalendarEvent>, updateSeries?: boolean) => void;
  onDelete: (id: string, deleteSeries?: boolean) => void;
}

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSave,
  onUpdate,
  onDelete,
}: EventModalProps) {
  const isEditing = !!event;
  const isRecurringInstance = event?.seriesId && event.seriesId !== event.id;
  
  const getDefaultStartDate = () => {
    if (event) return format(parseISO(event.startDateTime), "yyyy-MM-dd'T'HH:mm");
    if (defaultDate) return format(defaultDate, "yyyy-MM-dd'T'HH:mm");
    const now = new Date();
    return format(setMinutes(setHours(now, now.getHours() + 1), 0), "yyyy-MM-dd'T'HH:mm");
  };
  
  const getDefaultEndDate = () => {
    if (event) return format(parseISO(event.endDateTime), "yyyy-MM-dd'T'HH:mm");
    if (defaultDate) return format(addHours(defaultDate, 1), "yyyy-MM-dd'T'HH:mm");
    const now = new Date();
    return format(setMinutes(setHours(now, now.getHours() + 2), 0), "yyyy-MM-dd'T'HH:mm");
  };

  const [title, setTitle] = useState(event?.title || '');
  const [startDateTime, setStartDateTime] = useState(getDefaultStartDate());
  const [endDateTime, setEndDateTime] = useState(getDefaultEndDate());
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [location, setLocation] = useState(event?.location || '');
  const [notes, setNotes] = useState(event?.notes || '');
  const [category, setCategory] = useState<EventCategory>(event?.category || 'operations');
  const [isCompleted, setIsCompleted] = useState(event?.isCompleted || false);
  const [linkedModule, setLinkedModule] = useState<LinkedModule>(event?.linkedModule || 'none');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    event?.recurrenceRule?.frequency || 'none'
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    event?.recurrenceRule?.interval || 1
  );
  const [recurrenceByDay, setRecurrenceByDay] = useState<number[]>(
    event?.recurrenceRule?.byDay || []
  );
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [seriesAction, setSeriesAction] = useState<'save' | 'delete'>('save');

  // Reset form when event changes
  useEffect(() => {
    if (isOpen) {
      setTitle(event?.title || '');
      setStartDateTime(getDefaultStartDate());
      setEndDateTime(getDefaultEndDate());
      setAllDay(event?.allDay || false);
      setLocation(event?.location || '');
      setNotes(event?.notes || '');
      setCategory(event?.category || 'operations');
      setIsCompleted(event?.isCompleted || false);
      setLinkedModule(event?.linkedModule || 'none');
      setRecurrenceFrequency(event?.recurrenceRule?.frequency || 'none');
      setRecurrenceInterval(event?.recurrenceRule?.interval || 1);
      setRecurrenceByDay(event?.recurrenceRule?.byDay || []);
    }
  }, [isOpen, event]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      allDay,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      category,
      recurrenceRule: recurrenceFrequency !== 'none' ? {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        byDay: recurrenceByDay.length > 0 ? recurrenceByDay : undefined,
      } : undefined,
      timezone: 'Asia/Jerusalem',
      isCompleted,
      linkedModule,
    };

    if (isEditing) {
      if (isRecurringInstance) {
        setSeriesAction('save');
        setShowSeriesDialog(true);
      } else {
        onUpdate(event!.id, eventData);
        onClose();
      }
    } else {
      onSave(eventData);
      onClose();
    }
  };

  const handleSeriesAction = (allSeries: boolean) => {
    if (seriesAction === 'save') {
      const eventData: Partial<CalendarEvent> = {
        title: title.trim(),
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        allDay,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        category,
        isCompleted,
        linkedModule,
      };
      onUpdate(event!.id, eventData, allSeries);
    } else {
      onDelete(event!.id, allSeries);
    }
    setShowSeriesDialog(false);
    onClose();
  };

  const handleDeleteClick = () => {
    if (isRecurringInstance) {
      setSeriesAction('delete');
      setShowSeriesDialog(true);
    } else {
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    onDelete(event!.id, false);
    setShowDeleteDialog(false);
    onClose();
  };

  const toggleWeekday = (day: number) => {
    setRecurrenceByDay(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                className="bg-background"
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="allDay">All day</Label>
              <Switch
                id="allDay"
                checked={allDay}
                onCheckedChange={setAllDay}
              />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type={allDay ? 'date' : 'datetime-local'}
                  value={allDay ? startDateTime.split('T')[0] : startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type={allDay ? 'date' : 'datetime-local'}
                  value={allDay ? endDateTime.split('T')[0] : endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select 
                value={recurrenceFrequency} 
                onValueChange={(v) => setRecurrenceFrequency(v as RecurrenceFrequency)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weekly days selection */}
            {recurrenceFrequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex gap-1">
                  {WEEKDAY_OPTIONS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        recurrenceByDay.includes(day.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="bg-background"
              />
            </div>

            {/* Linked Module */}
            <div className="space-y-2">
              <Label>Linked Module</Label>
              <Select value={linkedModule} onValueChange={(v) => setLinkedModule(v as LinkedModule)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {LINKED_MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes"
                className="bg-background min-h-[80px]"
              />
            </div>

            {/* Mark as completed */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="completed"
                checked={isCompleted}
                onCheckedChange={(checked) => setIsCompleted(checked === true)}
              />
              <Label htmlFor="completed" className="font-normal">
                Mark as completed
              </Label>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!title.trim()}>
                {isEditing ? 'Save' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Series action dialog */}
      <AlertDialog open={showSeriesDialog} onOpenChange={setShowSeriesDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {seriesAction === 'save' ? 'Edit Recurring Event' : 'Delete Recurring Event'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is a recurring event. Would you like to {seriesAction === 'save' ? 'update' : 'delete'} all events in the series, or just this one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => handleSeriesAction(false)}>
              This Event Only
            </Button>
            <Button onClick={() => handleSeriesAction(true)}>
              All Events
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
