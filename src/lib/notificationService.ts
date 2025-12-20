import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface CreateNotificationParams {
  userId: string;
  actorUserId?: string;
  taskId?: string;
  type: 'task_assigned' | 'status_changed' | 'urgency_changed' | 'new_update';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification({
  userId,
  actorUserId,
  taskId,
  type,
  title,
  message,
  metadata,
}: CreateNotificationParams): Promise<boolean> {
  // First check if user has this notification type enabled
  const { data: settings } = await supabase
    .from('portfolio_settings')
    .select('notify_on_assignment, notify_on_status_change, notify_on_urgency_change, notify_on_new_update')
    .eq('user_id', userId)
    .maybeSingle();

  // Check preferences (default to true if no settings)
  const prefMap: Record<string, keyof typeof settings> = {
    task_assigned: 'notify_on_assignment',
    status_changed: 'notify_on_status_change',
    urgency_changed: 'notify_on_urgency_change',
    new_update: 'notify_on_new_update',
  };

  const prefKey = prefMap[type];
  if (settings && prefKey && settings[prefKey] === false) {
    console.log(`Notification type ${type} disabled for user`);
    return false;
  }

  const insertData = {
    user_id: userId,
    actor_user_id: actorUserId || null,
    task_id: taskId || null,
    type,
    title,
    message,
    metadata: (metadata ? JSON.parse(JSON.stringify(metadata)) : null) as Json,
  };

  const { error } = await supabase
    .from('notifications')
    .insert([insertData]);

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }

  return true;
}

export async function notifyTaskStatusChange(
  userId: string,
  taskName: string,
  taskId: string,
  oldStatus: string,
  newStatus: string,
  actorUserId?: string
) {
  return createNotification({
    userId,
    actorUserId,
    taskId,
    type: 'status_changed',
    title: 'Task Status Updated',
    message: `"${taskName}" status changed from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}`,
    metadata: { oldStatus, newStatus },
  });
}

export async function notifyTaskUrgencyChange(
  userId: string,
  taskName: string,
  taskId: string,
  oldUrgency: string,
  newUrgency: string,
  actorUserId?: string
) {
  return createNotification({
    userId,
    actorUserId,
    taskId,
    type: 'urgency_changed',
    title: 'Task Urgency Changed',
    message: `"${taskName}" urgency changed from ${oldUrgency} to ${newUrgency}`,
    metadata: { oldUrgency, newUrgency },
  });
}

export async function notifyNewTaskUpdate(
  userId: string,
  taskName: string,
  taskId: string,
  updatePreview: string,
  actorUserId?: string
) {
  return createNotification({
    userId,
    actorUserId,
    taskId,
    type: 'new_update',
    title: 'New Task Update',
    message: `New update on "${taskName}": ${updatePreview.substring(0, 100)}${updatePreview.length > 100 ? '...' : ''}`,
    metadata: { updatePreview },
  });
}

export async function notifyTaskAssignment(
  userId: string,
  taskName: string,
  taskId: string,
  actorUserId?: string
) {
  return createNotification({
    userId,
    actorUserId,
    taskId,
    type: 'task_assigned',
    title: 'Task Assigned',
    message: `You've been assigned to "${taskName}"`,
  });
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
