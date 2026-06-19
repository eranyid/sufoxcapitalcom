import { addDays } from 'date-fns';
import type { ProjectMilestone, MilestoneStatus } from '@/types/projects';
import type { GanttBar } from '@/components/projects/MilestoneGanttChart';

/**
 * Derives Gantt bars from an ordered list of milestones.
 * A milestone's bar runs from the previous milestone's due date (or the project
 * start date) up to its own due date. Milestones without a due date are skipped.
 */
export function milestonesToGanttBars(
  milestones: ProjectMilestone[],
  projectStartDate?: string | null,
): GanttBar[] {
  const dated = milestones.filter(m => m.due_date);
  if (dated.length === 0) return [];

  const bars: GanttBar[] = [];
  let prevEnd: Date | null = projectStartDate ? new Date(projectStartDate) : null;

  for (const m of dated) {
    const end = new Date(m.due_date as string);
    // Fall back to a 1-day bar when there is no sensible start anchor.
    let start = prevEnd && prevEnd < end ? prevEnd : addDays(end, -1);
    if (start > end) start = addDays(end, -1);

    bars.push({
      id: m.id,
      title: m.title,
      description: m.description,
      status: m.status as MilestoneStatus,
      start,
      end,
    });
    prevEnd = end;
  }

  return bars;
}
