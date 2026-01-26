export interface TaskSubtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}
