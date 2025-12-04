import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const COMMANDS: Record<string, { path: string; description: string }> = {
  'OVRV': { path: '/', description: 'Overview Dashboard' },
  'HLD': { path: '/', description: 'Holdings Overview' },
  'PERF': { path: '/performance', description: 'Performance Analytics' },
  'RISK': { path: '/risk', description: 'Risk Analytics' },
  'VAR': { path: '/risk', description: 'Value at Risk' },
  'SCN': { path: '/scenarios', description: 'Scenario Builder' },
  'STRESS': { path: '/scenarios', description: 'Stress Testing' },
  'XRAY': { path: '/xray', description: 'Portfolio X-Ray' },
  'TXN': { path: '/transactions', description: 'Transactions' },
  'VAL': { path: '/valuations', description: 'Valuations' },
  'MGMT': { path: '/management', description: 'Management Console' },
  'SET': { path: '/settings', description: 'Settings' },
};

export function CommandBar() {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredCommands = Object.entries(COMMANDS).filter(([cmd]) =>
    cmd.toLowerCase().startsWith(input.toUpperCase().split(' ')[0])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = input.toUpperCase().trim().replace('<GO>', '').trim();
    
    // Check for direct command
    if (COMMANDS[command]) {
      navigate(COMMANDS[command].path);
      setInput('');
      setShowSuggestions(false);
      return;
    }

    // Check for scenario command like "SCN NVDA -10%"
    if (command.startsWith('SCN ') || command.startsWith('STRESS ')) {
      navigate('/scenarios', { state: { command: input } });
      setInput('');
      setShowSuggestions(false);
      return;
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInput('');
    }
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="command-bar">
        <span className="text-primary font-mono text-xxs">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command... (OVRV, RISK, SCN <GO>)"
          className="command-bar-input"
          spellCheck={false}
          autoComplete="off"
        />
        <span className="text-primary cursor-blink font-mono">|</span>
        <span className="text-muted-foreground text-xxs font-mono">{'<GO>'}</span>
      </form>

      {showSuggestions && input.length > 0 && filteredCommands.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-px bg-secondary border border-border z-50">
          {filteredCommands.slice(0, 6).map(([cmd, { description }]) => (
            <button
              key={cmd}
              type="button"
              className={cn(
                "w-full px-3 py-1 text-left text-xs font-mono flex items-center justify-between",
                "hover:bg-primary hover:text-primary-foreground transition-colors"
              )}
              onClick={() => {
                setInput(cmd);
                navigate(COMMANDS[cmd].path);
                setShowSuggestions(false);
                setInput('');
              }}
            >
              <span className="text-primary font-semibold">{cmd}</span>
              <span className="text-muted-foreground text-xxs">{description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}