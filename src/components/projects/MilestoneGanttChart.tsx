import { useMemo, useState } from 'react';
import { scaleTime } from 'd3-scale';
import { format, differenceInCalendarDays } from 'date-fns';
import type { MilestoneStatus } from '@/types/projects';

export interface GanttBar {
  id: string;
  title: string;
  description?: string | null;
  status: MilestoneStatus;
  /** Inclusive start (yyyy-MM-dd or ISO). */
  start: Date;
  /** Inclusive end (yyyy-MM-dd or ISO). */
  end: Date;
}

export interface GanttRow {
  groupId: string;
  groupLabel: string;
  /** Optional click handler for the group label (e.g. navigate to project). */
  onGroupClick?: () => void;
  bars: GanttBar[];
}

const STATUS_FILL: Record<MilestoneStatus, string> = {
  pending: 'hsl(var(--muted-foreground) / 0.35)',
  in_progress: 'hsl(217 91% 60%)',
  completed: 'hsl(160 84% 39%)',
  skipped: 'hsl(var(--muted-foreground) / 0.15)',
};

const ROW_HEIGHT = 36;
const BAR_HEIGHT = 18;
const LABEL_WIDTH = 200;
const TOP_AXIS = 28;
const MIN_BAR_PX = 6;

interface MilestoneGanttChartProps {
  rows: GanttRow[];
  /** Reference "today" line; defaults to current date. */
  today?: Date;
}

export function MilestoneGanttChart({ rows, today }: MilestoneGanttChartProps) {
  const [hover, setHover] = useState<{ x: number; y: number; bar: GanttBar } | null>(null);

  const allBars = useMemo(() => rows.flatMap(r => r.bars), [rows]);

  const { minDate, maxDate } = useMemo(() => {
    if (allBars.length === 0) {
      const now = today ?? new Date();
      return { minDate: now, maxDate: now };
    }
    let min = allBars[0].start;
    let max = allBars[0].end;
    for (const b of allBars) {
      if (b.start < min) min = b.start;
      if (b.end > max) max = b.end;
    }
    return { minDate: min, maxDate: max };
  }, [allBars, today]);

  // Pad the timeline a little on each side for readability.
  const spanDays = Math.max(1, differenceInCalendarDays(maxDate, minDate));
  const pad = Math.max(2, Math.round(spanDays * 0.04));
  const domainStart = new Date(minDate);
  domainStart.setDate(domainStart.getDate() - pad);
  const domainEnd = new Date(maxDate);
  domainEnd.setDate(domainEnd.getDate() + pad);

  // ~10px per day, min 720px chart area so short timelines still read well.
  const totalDays = Math.max(1, differenceInCalendarDays(domainEnd, domainStart));
  const chartWidth = Math.max(720, totalDays * 10);
  const x = scaleTime().domain([domainStart, domainEnd]).range([0, chartWidth]);

  const chartHeight = TOP_AXIS + rows.length * ROW_HEIGHT + 8;
  const todayDate = today ?? new Date();
  const todayX = x(todayDate);
  const showToday = todayDate >= domainStart && todayDate <= domainEnd;

  // Month gridlines.
  const ticks = x.ticks(Math.min(12, Math.max(3, Math.round(totalDays / 30))));

  if (rows.length === 0) return null;

  return (
    <div className="relative w-full overflow-x-auto border border-border rounded-lg bg-card">
      <div className="flex">
        {/* Sticky group label column */}
        <div className="shrink-0 sticky left-0 z-10 bg-card border-r border-border" style={{ width: LABEL_WIDTH }}>
          <div style={{ height: TOP_AXIS }} className="border-b border-border" />
          {rows.map(row => (
            <div
              key={row.groupId}
              className={`flex items-center px-3 text-xs font-medium truncate border-b border-border/50 ${
                row.onGroupClick ? 'cursor-pointer hover:text-primary' : ''
              }`}
              style={{ height: ROW_HEIGHT }}
              onClick={row.onGroupClick}
              title={row.groupLabel}
            >
              {row.groupLabel}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <svg width={chartWidth} height={chartHeight} className="block">
          {/* Month gridlines + labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={x(t)}
                x2={x(t)}
                y1={TOP_AXIS}
                y2={chartHeight}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                opacity={0.4}
              />
              <text x={x(t) + 4} y={18} fontSize={10} fill="hsl(var(--muted-foreground))">
                {format(t, 'MMM yyyy')}
              </text>
            </g>
          ))}

          {/* Today marker */}
          {showToday && (
            <g>
              <line
                x1={todayX}
                x2={todayX}
                y1={TOP_AXIS - 6}
                y2={chartHeight}
                stroke="hsl(38 92% 50%)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <text x={todayX + 4} y={TOP_AXIS - 8} fontSize={9} fill="hsl(38 92% 50%)" fontWeight={600}>
                TODAY
              </text>
            </g>
          )}

          {/* Bars */}
          {rows.map((row, rowIdx) => {
            const rowY = TOP_AXIS + rowIdx * ROW_HEIGHT;
            return (
              <g key={row.groupId}>
                <line
                  x1={0}
                  x2={chartWidth}
                  y1={rowY + ROW_HEIGHT}
                  y2={rowY + ROW_HEIGHT}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  opacity={0.3}
                />
                {row.bars.map(bar => {
                  const bx = x(bar.start);
                  const bw = Math.max(MIN_BAR_PX, x(bar.end) - bx);
                  const by = rowY + (ROW_HEIGHT - BAR_HEIGHT) / 2;
                  return (
                    <rect
                      key={bar.id}
                      x={bx}
                      y={by}
                      width={bw}
                      height={BAR_HEIGHT}
                      rx={4}
                      fill={STATUS_FILL[bar.status]}
                      stroke={bar.status === 'skipped' ? 'hsl(var(--border))' : 'none'}
                      strokeDasharray={bar.status === 'skipped' ? '3 2' : undefined}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onMouseEnter={() => setHover({ x: bx + bw / 2, y: by, bar })}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md max-w-xs"
          style={{ left: hover.x + LABEL_WIDTH, top: hover.y - 8 }}
        >
          <div className="font-medium">{hover.bar.title}</div>
          {hover.bar.description && (
            <div className="text-muted-foreground mt-0.5 line-clamp-2">{hover.bar.description}</div>
          )}
          <div className="text-muted-foreground mt-1 font-mono">
            {format(hover.bar.start, 'MMM d')} → {format(hover.bar.end, 'MMM d, yyyy')}
          </div>
          <div className="capitalize mt-0.5">{hover.bar.status.replace('_', ' ')}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
        {(['pending', 'in_progress', 'completed', 'skipped'] as MilestoneStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: STATUS_FILL[s] }} />
            <span className="capitalize">{s.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
