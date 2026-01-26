import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Predefined tag colors
const TAG_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
];

function getTagColor(tag: string) {
  // Simple hash to consistently assign colors
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

interface TagsDisplayProps {
  tags: string[];
  onUpdate?: (tags: string[]) => void;
  editable?: boolean;
  maxVisible?: number;
}

export function TagsDisplay({ tags, onUpdate, editable = false, maxVisible = 2 }: TagsDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  const handleAddTag = () => {
    if (!newTag.trim() || !onUpdate) return;
    const trimmedTag = newTag.trim().toLowerCase();
    if (!tags.includes(trimmedTag)) {
      onUpdate([...tags, trimmedTag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!onUpdate) return;
    onUpdate(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (tags.length === 0 && !editable) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onClick={(e) => {
            if (editable) {
              e.stopPropagation();
              setIsOpen(true);
            }
          }}
        >
          {visibleTags.map(tag => {
            const color = getTagColor(tag);
            return (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${color.bg} ${color.text} ${color.border}`}
              >
                {tag}
              </span>
            );
          })}
          {hiddenCount > 0 && (
            <span className="text-xs text-muted-foreground">+{hiddenCount}</span>
          )}
          {editable && tags.length === 0 && (
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Plus className="h-3 w-3" />
              Add tag
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => {
              const color = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${color.bg} ${color.text} ${color.border}`}
                >
                  {tag}
                  {editable && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          
          {editable && (
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                Add
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
