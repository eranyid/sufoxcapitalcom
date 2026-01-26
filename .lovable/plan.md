
# Back Office Enhancement Plan - Monday.com Style

## Overview
Transform the Back Office section into a more comprehensive work management hub similar to Monday.com, with enhanced visualization, dashboard widgets, and improved workflows.

---

## New Features to Add

### 1. Dashboard Summary Section (New Component)
Add a summary dashboard at the top of the Back Office that provides at-a-glance insights:

**Widgets to include:**
- **Task Overview Numbers**: Total issues, overdue count, completed this week
- **Urgency Distribution Chart**: Donut/pie chart showing urgent vs high vs medium vs low
- **Upcoming Due Dates**: Mini timeline of next 7 days with task counts
- **Recent Activity Feed**: Last 5 activities across all issues
- **My Tasks Quick Filter**: Button to show only tasks assigned to "Me"

### 2. Enhanced Issues Table with Additional Columns
Extend the current table with more Monday.com-style columns:

**New columns:**
- **Owner/Assignee Column**: Avatar + name display (currently just text)
- **Time Tracking Column**: Estimated hours / actual hours
- **Tags/Labels Column**: Colored tags for categorization
- **Subtasks Progress**: Mini progress bar showing subtask completion (e.g., "2/5")
- **Last Updated Column**: "2h ago" style relative timestamps

### 3. Kanban Board View Toggle
Add ability to switch between Table view and Kanban board view:

**Implementation:**
- Toggle button in header: Table | Kanban
- Kanban columns: Backlog, Planned, In Progress, Completed, Canceled
- Drag-and-drop using existing `@dnd-kit` dependency
- Cards show: title, urgency badge, due date, owner avatar

### 4. Quick Actions & Bulk Operations
Add multi-select and bulk actions:

**Features:**
- Checkbox column for multi-select
- Bulk actions bar: Change Status, Change Urgency, Delete, Assign
- Quick add row at bottom of table (inline creation)

### 5. Timeline View Enhancements
Improve the existing Timeline with:

**Additions:**
- Group events by day with date headers
- Expand/collapse day sections
- Quick filters as toggle chips (not just dropdown)
- Activity type icons with color coding

### 6. Projects List Improvements
Enhance the Projects tab:

**New elements:**
- Circular progress indicator (like Monday.com)
- Owner avatars on project cards
- Quick status update inline
- Color-coded project labels

---

## Technical Implementation

### Database Changes
Add new columns to `crm_tasks`:
- `estimated_hours` (numeric, nullable)
- `actual_hours` (numeric, nullable)  
- `tags` (text array)

Create new table `task_subtasks`:
- `id`, `task_id`, `user_id`, `title`, `is_completed`, `order_index`, `created_at`

### New Components to Create

```text
src/components/backoffice/
  BackOfficeDashboard.tsx     -- Summary widgets section
  TaskKanbanBoard.tsx         -- Kanban view component
  TaskKanbanCard.tsx          -- Individual draggable card
  TaskOverviewStats.tsx       -- Numbers widget
  UrgencyDistributionChart.tsx-- Donut chart widget
  UpcomingDueDates.tsx        -- Mini timeline widget
  BulkActionsBar.tsx          -- Multi-select actions
  SubtasksProgress.tsx        -- Subtasks mini progress
  TagsColumn.tsx              -- Tags display/edit
```

### Files to Modify

1. **`src/pages/BackOfficeTasks.tsx`**
   - Add view toggle (Table/Kanban)
   - Add bulk select functionality
   - Add quick filters
   - Integrate dashboard component

2. **`src/components/layout/BackOfficeLayout.tsx`**
   - Update layout to support dashboard header area

3. **`src/types/crm.ts`**
   - Add new types for subtasks, tags

4. **`src/hooks/useCrmTasks.ts`**
   - Add support for new fields
   - Add bulk update operations

5. **`src/pages/BackOfficeTimeline.tsx`**
   - Add day grouping
   - Add chip-style filters

---

## UI/UX Design Details

### Color Scheme (Monday.com inspired, adapted to dark theme)
- Keep existing status colors from `TaskStatusBadge`
- Use consistent urgency colors from `TaskUrgencyBadge`
- Dashboard cards: `bg-card` with subtle border

### Widget Layout
```text
+----------------------------------+
|  [Summary Stats Row]             |
|  [Tasks] [Overdue] [Done] [Rate] |
+----------------------------------+
|  [Status Battery]                |
+----------------------------------+
|  [Filters Row]                   |
|  View: [Table][Kanban] + filters |
+----------------------------------+
|  [Main Content - Table/Kanban]   |
+----------------------------------+
```

### Mobile Considerations
- Dashboard widgets stack vertically
- Kanban board scrolls horizontally
- Bulk actions as bottom sheet

---

## Implementation Priority

**Phase 1 (Core)**
1. Summary stats row with key metrics
2. Enhanced table with new columns (tags, last updated)
3. Quick inline task creation

**Phase 2 (Visual)**
4. Kanban board view toggle
5. Day-grouped timeline
6. Bulk actions support

**Phase 3 (Advanced)**
7. Subtasks with progress
8. Time tracking columns
9. Advanced filters & saved views
