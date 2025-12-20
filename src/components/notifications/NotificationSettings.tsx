import { Bell, UserPlus, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences, NotificationPreferences } from '@/hooks/useNotificationPreferences';

const settingsConfig: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: typeof Bell;
}> = [
  {
    key: 'notify_on_assignment',
    label: 'Task Assignment',
    description: 'When a task is assigned to you',
    icon: UserPlus,
  },
  {
    key: 'notify_on_status_change',
    label: 'Status Changes',
    description: 'When a task status is updated',
    icon: RefreshCw,
  },
  {
    key: 'notify_on_urgency_change',
    label: 'Urgency Changes',
    description: 'When task urgency is modified',
    icon: AlertCircle,
  },
  {
    key: 'notify_on_new_update',
    label: 'New Updates',
    description: 'When comments are added to tasks',
    icon: MessageSquare,
  },
];

export function NotificationSettings() {
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-9" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
        <Bell className="h-4 w-4" />
        Notification Preferences
      </div>
      
      {settingsConfig.map(({ key, label, description, icon: Icon }) => (
        <div 
          key={key}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                {label}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
          </div>
          <Switch
            id={key}
            checked={preferences[key]}
            onCheckedChange={(checked) => updatePreference(key, checked)}
          />
        </div>
      ))}
    </div>
  );
}
