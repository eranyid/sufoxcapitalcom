export type TaskStatus = 'backlog' | 'planned' | 'in_progress' | 'completed' | 'canceled';
export type TaskUrgency = 'none' | 'urgent' | 'high' | 'medium' | 'low';
export type BoardStatus = 'working_on_it' | 'done' | 'stuck';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectStatus = 'active' | 'monitoring' | 'archived';
export type GroupName = 'ongoing_holding' | 'potential' | 'old_exits';

export interface CrmProject {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  start_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmTask {
  id: string;
  user_id: string;
  project_id: string | null;
  company_id: string | null;
  linked_project_id: string | null;
  task_name: string;
  description: string | null;
  owner: string;
  due_date: string | null;
  status: TaskStatus;
  urgency: TaskUrgency;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmCompany {
  id: string;
  user_id: string;
  project_id: string | null;
  company_name: string;
  ticker: string | null;
  market_cap: string | null;
  sector: string | null;
  geography: string | null;
  investment_thesis: string | null;
  status: string;
  notes: string | null;
  group_name: GroupName;
  timeline_start: string | null;
  timeline_end: string | null;
  is_auto_linked: boolean;
  source_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmFund {
  id: string;
  user_id: string;
  project_id: string | null;
  fund_name: string;
  strategy: string | null;
  asset_class: string | null;
  geography: string | null;
  manager: string | null;
  status: string;
  priority: Priority;
  notes: string | null;
  group_name: GroupName;
  timeline_start: string | null;
  timeline_end: string | null;
  created_at: string;
  updated_at: string;
}

// Status options for task status dropdown
export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

export const URGENCY_OPTIONS: { value: TaskUrgency; label: string }[] = [
  { value: 'none', label: 'No priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const BOARD_STATUS_OPTIONS: { value: BoardStatus; label: string }[] = [
  { value: 'working_on_it', label: 'Working on it' },
  { value: 'done', label: 'Done' },
  { value: 'stuck', label: 'Stuck' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'archived', label: 'Archived' },
];

export const GROUP_OPTIONS: { value: GroupName; label: string }[] = [
  { value: 'ongoing_holding', label: 'Ongoing Holding' },
  { value: 'potential', label: 'Potential' },
  { value: 'old_exits', label: 'Old Exits' },
];

// Table groups for the Tasks board UI - exactly 3 tables
export type TaskTableGroup = 'in_progress' | 'done' | 'canceled';

// Helper to determine which table a task belongs to based on status
export function getTaskTableGroup(status: TaskStatus): TaskTableGroup {
  switch (status) {
    case 'completed':
      return 'done';
    case 'canceled':
      return 'canceled';
    case 'backlog':
    case 'planned':
    case 'in_progress':
    default:
      return 'in_progress';
  }
}
