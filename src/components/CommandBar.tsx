import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Terminal, CornerDownLeft } from 'lucide-react';

interface CommandBarProps {
  onOpenActivityLog?: () => void;
}

interface CommandConfig {
  path?: string;
  action?: string;
  tab?: string;
  label: string;
  description: string;
}

const COMMANDS: Record<string, CommandConfig> = {
  'overview': { path: '/', label: 'Overview', description: 'Go to dashboard overview' },
  'backoffice': { path: '/backoffice', label: 'Back Office', description: 'Investment back office' },
  'performance': { path: '/performance', label: 'Performance', description: 'Portfolio performance analytics' },
  'risk': { path: '/risk', label: 'Risk', description: 'Risk analysis and VaR' },
  'research': { path: '/research', label: 'Research', description: 'Research and watchlist' },
  'policy': { path: '/policy', label: 'Policy', description: 'Investment policy settings' },
  'transactions': { path: '/transactions', label: 'Transactions', description: 'Transaction history' },
  'valuations': { path: '/valuations', label: 'Valuations', description: 'Asset valuations' },
  'settings': { path: '/settings', label: 'Settings', description: 'Application settings' },
  'admin': { path: '/admin/users', label: 'Admin', description: 'User administration' },
  'help': { path: '/help', label: 'Help', description: 'Help and documentation' },
  'activity': { action: 'activity', label: 'Activity Log', description: 'Open activity log' },
};

// Simple fuzzy match - checks if all chars in query appear in target in order
function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  if (!q) return { match: true, score: 0 };
  if (t.includes(q)) return { match: true, score: 100 - t.indexOf(q) }; // Exact substring gets high score
  
  let qIdx = 0;
  let score = 0;
  let consecutiveBonus = 0;
  
  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5; // Reward consecutive matches
      qIdx++;
    } else {
      consecutiveBonus = 0;
    }
  }
  
  return { match: qIdx === q.length, score };
}

export function CommandBar({ onOpenActivityLog }: CommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter and sort commands based on fuzzy match
  const filteredCommands = useMemo(() => {
    const query = command.trim().toLowerCase();
    
    const results = Object.entries(COMMANDS)
      .map(([key, config]) => {
        const keyMatch = fuzzyMatch(query, key);
        const labelMatch = fuzzyMatch(query, config.label);
        const descMatch = fuzzyMatch(query, config.description);
        const bestScore = Math.max(keyMatch.score, labelMatch.score, descMatch.score * 0.5);
        const matches = keyMatch.match || labelMatch.match || descMatch.match;
        
        return { key, config, score: bestScore, matches };
      })
      .filter(r => r.matches)
      .sort((a, b) => b.score - a.score);
    
    return results;
  }, [command]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length, command]);

  // Handle keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setCommand('');
        setError(null);
        setSelectedIndex(0);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setCommand('');
        setError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredCommands.length]);

  const executeCommand = useCallback((commandKey: string) => {
    const commandConfig = COMMANDS[commandKey];

    if (!commandConfig) {
      setError('Unknown command');
      return;
    }

    setError(null);
    setIsOpen(false);
    setCommand('');

    if (commandConfig.action === 'activity') {
      onOpenActivityLog?.();
      return;
    }

    if (commandConfig.path) {
      if (commandConfig.tab) {
        navigate(commandConfig.path, { state: { tab: commandConfig.tab } });
      } else {
        navigate(commandConfig.path);
      }
    }
  }, [navigate, onOpenActivityLog]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        executeCommand(filteredCommands[selectedIndex].key);
      } else {
        setError('Unknown command');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab to autocomplete with selected suggestion
      if (filteredCommands.length > 0) {
        setCommand(filteredCommands[selectedIndex].key);
      }
    }
  };

  const handleItemClick = (commandKey: string) => {
    executeCommand(commandKey);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          setCommand('');
          setError(null);
        }}
      />
      
      {/* Command Bar */}
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Command</span>
          <div className="ml-auto flex items-center gap-2">
            <kbd className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-mono">
              ESC
            </kbd>
            <button
              onClick={() => {
                setIsOpen(false);
                setCommand('');
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Input area */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <span className="text-primary font-mono text-sm">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type command..."
            className="flex-1 bg-transparent text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {command && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <kbd className="px-1 py-0.5 bg-muted rounded font-mono">TAB</kbd>
              <span>complete</span>
            </div>
          )}
        </div>

        {/* Suggestions list */}
        <div 
          ref={listRef}
          className="max-h-[280px] overflow-y-auto"
        >
          {filteredCommands.length > 0 ? (
            filteredCommands.map((item, index) => (
              <div
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-primary/10 border-l-2 border-l-primary' 
                    : 'border-l-2 border-l-transparent hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {item.key}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {item.config.description}
                  </span>
                </div>
                {index === selectedIndex && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CornerDownLeft className="h-3 w-3" />
                    <span>enter</span>
                  </div>
                )}
              </div>
            ))
          ) : command.trim() ? (
            <div className="px-4 py-4 text-center">
              <span className="text-sm text-destructive font-mono">Unknown command: "{command}"</span>
            </div>
          ) : null}
        </div>

        {/* Error message */}
        {error && !command.trim() && (
          <div className="px-4 py-2 border-t border-border/50">
            <span className="text-xs text-destructive font-mono">{error}</span>
          </div>
        )}

        {/* Footer with keyboard hints */}
        <div className="px-4 py-2 border-t border-border/50 bg-secondary/30 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-primary font-semibold">{filteredCommands.length}</span> commands available
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded font-mono">↵</kbd>
              select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
