import { LayoutList, Columns3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ViewMode = 'table' | 'kanban';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(val) => val && onChange(val as ViewMode)}
      className="bg-muted/30 p-1 rounded-lg"
    >
      <ToggleGroupItem 
        value="table" 
        aria-label="Table view"
        className="data-[state=on]:bg-card px-3 py-1.5"
      >
        <LayoutList className="h-4 w-4 mr-2" />
        <span className="text-sm">Table</span>
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="kanban" 
        aria-label="Kanban view"
        className="data-[state=on]:bg-card px-3 py-1.5"
      >
        <Columns3 className="h-4 w-4 mr-2" />
        <span className="text-sm">Kanban</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
