import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Terminal } from 'lucide-react';

interface CommandBarProps {
  onOpenActivityLog?: () => void;
}

const COMMANDS: Record<string, { path?: string; action?: string; tab?: string }> = {
  'crm': { path: '/crm' },
  'crm companies': { path: '/crm', tab: 'companies' },
  'crm tasks': { path: '/crm', tab: 'tasks' },
  'crm timeline': { path: '/crm', tab: 'timeline' },
  'overview': { path: '/' },
  'performance': { path: '/performance' },
  'risk': { path: '/risk' },
  'research': { path: '/research' },
  'policy': { path: '/policy' },
  'transactions': { path: '/transactions' },
  'valuations': { path: '/valuations' },
  'settings': { path: '/settings' },
  'admin': { path: '/admin' },
  'activity': { action: 'activity' },
};

export function CommandBar({ onOpenActivityLog }: CommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setCommand('');
        setError(null);
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

  const executeCommand = useCallback(() => {
    const normalizedCommand = command.trim().toLowerCase();
    
    if (!normalizedCommand) {
      return;
    }

    const commandConfig = COMMANDS[normalizedCommand];

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
      // Navigate with optional tab state
      if (commandConfig.tab) {
        navigate(commandConfig.path, { state: { tab: commandConfig.tab } });
      } else {
        navigate(commandConfig.path);
      }
    }
  }, [command, navigate, onOpenActivityLog]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
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
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
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
        <div className="flex items-center gap-3 px-4 py-3">
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
            placeholder="Type command and press Enter…"
            className="flex-1 bg-transparent text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 pb-3">
            <span className="text-xs text-destructive font-mono">{error}</span>
          </div>
        )}

        {/* Footer with hint */}
        <div className="px-4 py-2 border-t border-border/50 bg-secondary/30">
          <p className="text-[10px] text-muted-foreground font-mono">
            <span className="text-primary">HINT:</span> overview • crm • performance • risk • research • transactions • settings
          </p>
        </div>
      </div>
    </div>
  );
}
