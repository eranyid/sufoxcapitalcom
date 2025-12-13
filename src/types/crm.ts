export type TaskStatus = 'backlog' | 'in_progress' | 'waiting' | 'completed';
export type TaskUrgency = 'low' | 'medium' | 'high' | 'critical';
export type CompanyStatus = 'research' | 'contacted' | 'monitoring' | 'rejected';
export type FundStatus = 'screening' | 'dd' | 'approved' | 'rejected';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

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

export interface CrmCompany {
  id: string;
  user_id: string;
  company_name: string;
  sector: string | null;
  geography: string | null;
  investment_thesis: string | null;
  status: CompanyStatus;
  priority: Priority;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmFund {
  id: string;
  user_id: string;
  fund_name: string;
  strategy: string | null;
  asset_class: string | null;
  geography: string | null;
  manager: string | null;
  status: FundStatus;
  priority: Priority;
  notes: string | null;
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

export const COMPANY_STATUS_OPTIONS: { value: CompanyStatus; label: string }[] = [
  { value: 'research', label: 'Research' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'rejected', label: 'Rejected' },
];

export const FUND_STATUS_OPTIONS: { value: FundStatus; label: string }[] = [
  { value: 'screening', label: 'Screening' },
  { value: 'dd', label: 'Due Diligence' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];
