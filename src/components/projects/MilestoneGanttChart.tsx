import { useMemo, useRef, useState } from 'react';
import { scaleTime } from 'd3-scale';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProjectMilestone, MilestoneStatus } from '@/types/projects';
import { MILESTONE_STATUS_OPTIONS } from '@/types/projects';

const STATUS_BAR_COLOR: Record<MilestoneStatus, string> = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#10b981',
  skipped: '#9ca3af',
};

const STATUS_BAR_BG: Record<MilestoneStatus, string> = {
  pending: '#6b728033',
  in_progress: '#3b82f633',
  completed: '#10b98133',
  skipped: '#9ca3af22',
};

interface MilestoneGanttChartProps {
  milestones: ProjectMilestone[];
  projectStartDate?: string | null;
}

interface GanttRow {
  milestone: ProjectMilestone;
  startDate: Date;
  endDate: Date;
}

const ROW_HEIGHT = 36;
const LABEL_WIDTH = 180;
const CHART_PADDING = { top: 32, right: 16, bottom: 8, left: 8 };
const TODAY_COLOR = '#f59e0b';

export function MilestoneGanttChart({ milestones, projectStartDate }: MilestoneGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const rows = useMemo<GanttRow[]>(() => {
    const dated = milestones.filter(m => m.due_date);
    if (dated.length === 0) return [];

    const projectStart = projectStartDate
      ? new Date(projectStartDate)
      : new Date(dated[0].due_date!);

    return dated.map((m, i) => {
      const endDate = new Date(m.due_date!);
      const startDate = i === 0
        ? projectStart
        : new Date(dated[i - 1].due_date!);
      return {
        milestone: m,
        startDate: startDate > endDate ? endDate : startDate,
        endDate,
      };
    });
  }, [milestones, projectStartDate]);

  const { timeScale, totalWidth, ticks } = useMemo(() => {
    if (rows.length === 0) {
      return { timeScale: null, totalWidth: 0, ticks: [] as Date[] };
    }

    const allDates = rows.flatMap(r => [r.startDate, r.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const today = new Date();
    const domainMin = new Date(Math.min(minDate.getTime(), today.getTime()));
    const domainMax = new Date(Math.max(maxDate.getTime(), today.getTime()));

    const paddedMin = addDays(domainMin, -3);
    const paddedMax = addDays(domainMax, 3);
    const chartWidth = Math.max(500, differenceInDays(paddedMax, paddedMin) * 8);

    const scale = scaleTime()
      .domain([paddedMin, paddedMax])
      .range([LABEL_WIDTH + CHART_PADDING.left, chartWidth - CHART_PADDING.right]);

    const generatedTicks = scale.ticks(Math.min(12, differenceInDays(paddedMax, paddedMin) / 7));

    return { timeScale: scale, totalWidth: chartWidth, ticks: generatedTicks };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic text-center py-6">
        No milestones with due dates to display on the Gantt chart.
      </div>
    );
  }

  if (!timeScale) return null;

  const totalHeight = CHART_PADDING.top + rows.length * ROW_HEIGHT + CHART_PADDING.bottom;
  const todayX = timeScale(new Date());

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        className="overflow-x-auto border border-border rounded-lg bg-card"
      >
        <svg
          width={totalWidth}
          height={totalHeight}
          className="select-none"
        >
          {/* Header tick labels */}
          {ticks.map((tick, i) => {
            const x = timeScale(tick);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={CHART_PADDING.top}
                  x2={x}
                  y2={totalHeight}
                  stroke="currentColor"
                  strokeOpacity={0.06}
                />
                <text
                  x={x}
                  y={CHART_PADDING.top - 10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                >
                  {format(tick, 'MMM d')}
                </text>
              </g>
            );
          })}

          {/* Today line */}
          <line
            x1={todayX}
            y1={CHART_PADDING.top - 4}
            x2={todayX}
            y2={totalHeight}
            stroke={TODAY_COLOR}
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <text
            x={todayX}
            y={CHART_PADDING.top - 10}
            textAnchor="middle"
            fill={TODAY_COLOR}
            fontSize={9}
            fontWeight={600}
            fontFamily="ui-monospace, monospace"
          >
            TODAY
          </text>

          {/* Rows */}
          {rows.map((row, i) => {
            const y = CHART_PADDING.top + i * ROW_HEIGHT;
            const status = row.milestone.status as MilestoneStatus;
            const barStart = timeScale(row.startDate);
            const barEnd = timeScale(row.endDate);
            const barWidth = Math.max(barEnd - barStart, 4);
            const barHeight = 20;
            const barY = y + (ROW_HEIGHT - barHeight) / 2;
            const isHovered = hoveredId === row.milestone.id;

            return (
              <g key={row.milestone.id}>
                {/* Row separator */}
                {i > 0 && (
                  <line
                    x1={0}
                    y1={y}
                    x2={totalWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.05}
                  />
                )}

                {/* Label */}
                <foreignObject
                  x={4}
                  y={barY}
                  width={LABEL_WIDTH - 8}
                  height={barHeight}
                >
                  <div className="flex items-center h-full">
                    <span
                      className={`text-xs truncate ${
                        status === 'skipped'
                          ? 'text-muted-foreground/50 line-through'
                          : status === 'completed'
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                      title={row.milestone.title}
                    >
                      {row.milestone.title}
                    </span>
                  </div>
                </foreignObject>

                {/* Bar */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <g
                      onMouseEnter={() => setHoveredId(row.milestone.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ cursor: 'default' }}
                    >
                      <rect
                        x={barStart}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx={4}
                        fill={STATUS_BAR_BG[status]}
                        stroke={STATUS_BAR_COLOR[status]}
                        strokeWidth={isHovered ? 1.5 : 1}
                        opacity={status === 'skipped' ? 0.4 : 1}
                      />
                      {status === 'completed' && (
                        <rect
                          x={barStart}
                          y={barY}
                          width={barWidth}
                          height={barHeight}
                          rx={4}
                          fill={STATUS_BAR_COLOR[status]}
                          opacity={0.25}
                        />
                      )}
                      {status === 'in_progress' && (
                        <rect
                          x={barStart}
                          y={barY}
                          width={Math.max(barWidth * 0.5, 4)}
                          height={barHeight}
                          rx={4}
                          fill={STATUS_BAR_COLOR[status]}
                          opacity={0.2}
                        />
                      )}
                      {/* Due date marker */}
                      <circle
                        cx={barEnd}
                        cy={barY + barHeight / 2}
                        r={3}
                        fill={STATUS_BAR_COLOR[status]}
                        opacity={status === 'skipped' ? 0.4 : 0.8}
                      />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="font-medium text-xs">{row.milestone.title}</div>
                      {row.milestone.description && (
                        <p className="text-xs text-muted-foreground">{row.milestone.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono">{format(row.endDate, 'MMM d, yyyy')}</span>
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_BAR_COLOR[status] }}
                        />
                        <span>{MILESTONE_STATUS_OPTIONS.find(o => o.value === status)?.label}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </g>
            );
          })}
        </svg>
      </div>
    </TooltipProvider>
  );
}
