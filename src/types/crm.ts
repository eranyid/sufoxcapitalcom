export type TaskStatus = 'backlog' | 'in_progress' | 'waiting' | 'completed';
export type TaskUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface CrmTask {
  id: string;
  user_id: string;
  task_name: string;
  description: string | null;
  owner: string;
  due_date: string | null;
  status: TaskStatus;
  urgency: TaskUrgency;
  created_at: string;
  updated_at: string;
}

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting / Blocked' },
  { value: 'completed', label: 'Completed' },
];

export const URGENCY_OPTIONS: { value: TaskUrgency; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];
