import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Search, Filter } from 'lucide-react';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { useCrmCompanies } from '@/hooks/useCrmCompanies';
import { useProjects } from '@/hooks/useProjects';
import { TaskStatusBadge } from '@/components/crm/TaskStatusBadge';
import { TaskUrgencyBadge } from '@/components/crm/TaskUrgencyBadge';
import { TaskDetailsPanel } from '@/components/crm/TaskDetailsPanel';
import { CrmTask, TaskStatus, TaskUrgency, STATUS_OPTIONS, URGENCY_OPTIONS } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function BackOfficeTasks() {
  const { tasks, loading: tasksLoading, updateTask } = useCrmTasks();
  const { companies, loading: companiesLoading } = useCrmCompanies();
  const { projects, loading: projectsLoading } = useProjects();
  
  const [selectedTask, setSelectedTask] = useState<CrmTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  // Create company lookup map
  const companyMap = useMemo(() => {
    return companies.reduce((acc, company) => {
      acc[company.id] = company;
      return acc;
    }, {} as Record<string, typeof companies[0]>);
  }, [companies]);

  // Create project lookup map
  const projectMap = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, typeof projects[0]>);
  }, [projects]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = task.task_name.toLowerCase().includes(query);
        const company = task.company_id ? companyMap[task.company_id] : null;
        const matchesCompany = company?.company_name.toLowerCase().includes(query);
        if (!matchesName && !matchesCompany) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      
      // Urgency filter
      if (urgencyFilter !== 'all' && task.urgency !== urgencyFilter) return false;
      
      return true;
    });
  }, [tasks, searchQuery, statusFilter, urgencyFilter, companyMap]);

  const handleRowClick = (task: CrmTask) => {
    setSelectedTask(task);
    setPanelOpen(true);
  };

  const handleTaskUpdate = async (id: string, field: keyof CrmTask, value: string | null) => {
    await updateTask(id, { [field]: value });
    // Update local selected task
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const loading = tasksLoading || companiesLoading || projectsLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CheckSquare className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Tasks</h2>
          <p className="text-xs text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} across all companies
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks or companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              {URGENCY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Task Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Urgency</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const company = task.company_id ? companyMap[task.company_id] : null;
                  const project = task.linked_project_id ? projectMap[task.linked_project_id] : null;
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task)}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {task.task_name}
                      </td>
                      <td className="px-4 py-3">
                        {company ? (
                          <Link
                            to={`/backoffice/company/${company.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            {company.company_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {project ? (
                          <Link
                            to={`/backoffice/projects/${project.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs"
                          >
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              {project.name}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status as TaskStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <TaskUrgencyBadge urgency={task.urgency as TaskUrgency} showIcon={false} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Panel */}
      <TaskDetailsPanel
        task={selectedTask}
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={handleTaskUpdate}
      />
    </div>
  );
}
