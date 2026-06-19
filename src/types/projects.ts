export type ProjectHealth = 'on_track' | 'at_risk' | 'off_track';
export type ProjectPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  lead_user_id: string | null;
  start_date: string | null;
  target_date: string | null;
  health_status: ProjectHealth;
  team: string[];
  labels: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  author_user_id: string;
  text: string;
  status: ProjectHealth;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  sort_order: number;
  template_key: string | null;
  created_at: string;
  updated_at: string;
}

export const MILESTONE_STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
];

export const HEALTH_OPTIONS: { value: ProjectHealth; label: string }[] = [
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'off_track', label: 'Off Track' },
];

export const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
