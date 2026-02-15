const GRID_DELAYS = [0, 75, 150, 225, 300, 375, 450, 525, 600];

function GridLoader() {
  return (
    <div className="relative w-[50px] h-[50px]">
      {GRID_DELAYS.map((delay, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return (
          <div
            key={i}
            className="absolute bg-primary/80"
            style={{
              width: 10,
              height: 10,
              top: '50%',
              left: '50%',
              marginTop: -5 + (row - 1) * 20,
              marginLeft: -5 + (col - 1) * 20,
              animation: `grid-loader 675ms ease-in-out ${delay}ms infinite alternate`,
            }}
          />
        );
      })}
    </div>
  );
}

function CircuitLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[220px]">
        <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
          {/* Background traces */}
          <path d="M10,30 H60 Q70,30 70,40 V60 Q70,70 80,70 H190" className="circuit-trace-bg" />
          <path d="M10,50 H40 Q50,50 50,40 V20 Q50,10 60,10 H130 Q140,10 140,20 V40 Q140,50 150,50 H190" className="circuit-trace-bg" />
          <path d="M10,70 H30 Q40,70 40,60 V50 Q40,40 50,40 H90 Q100,40 100,50 V80 Q100,90 110,90 H190" className="circuit-trace-bg" />
          
          {/* Animated flow traces */}
          <path d="M10,30 H60 Q70,30 70,40 V60 Q70,70 80,70 H190" className="circuit-trace-flow circuit-yellow" />
          <path d="M10,50 H40 Q50,50 50,40 V20 Q50,10 60,10 H130 Q140,10 140,20 V40 Q140,50 150,50 H190" className="circuit-trace-flow circuit-blue" />
          <path d="M10,70 H30 Q40,70 40,60 V50 Q40,40 50,40 H90 Q100,40 100,50 V80 Q100,90 110,90 H190" className="circuit-trace-flow circuit-green" />

          {/* Chip */}
          <rect x="75" y="25" width="50" height="50" rx="8" ry="8" fill="#1a1a2e" stroke="#444" strokeWidth="1" />
          <text x="100" y="54" textAnchor="middle" fill="hsl(var(--primary))" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
            {label ? label.slice(0, 4) : 'LOAD'}
          </text>

          {/* Chip pins */}
          <line x1="80" y1="25" x2="80" y2="18" stroke="#444" strokeWidth="1.5" />
          <line x1="90" y1="25" x2="90" y2="18" stroke="#444" strokeWidth="1.5" />
          <line x1="100" y1="25" x2="100" y2="18" stroke="#444" strokeWidth="1.5" />
          <line x1="110" y1="25" x2="110" y2="18" stroke="#444" strokeWidth="1.5" />
          <line x1="120" y1="25" x2="120" y2="18" stroke="#444" strokeWidth="1.5" />

          <line x1="80" y1="75" x2="80" y2="82" stroke="#444" strokeWidth="1.5" />
          <line x1="90" y1="75" x2="90" y2="82" stroke="#444" strokeWidth="1.5" />
          <line x1="100" y1="75" x2="100" y2="82" stroke="#444" strokeWidth="1.5" />
          <line x1="110" y1="75" x2="110" y2="82" stroke="#444" strokeWidth="1.5" />
          <line x1="120" y1="75" x2="120" y2="82" stroke="#444" strokeWidth="1.5" />
        </svg>
      </div>
      {label && (
        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
      )}
    </div>
  );
}

export function WidgetGridLoader({ label }: { label?: string }) {
  return <CircuitLoader label={label} />;
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <GridLoader />
    </div>
  );
}

export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <GridLoader />
        </div>
        <div className="space-y-2">
          <p className="text-primary font-mono text-sm tracking-wider">SUFOX CAPITAL</p>
          <p className="text-muted-foreground text-xs font-mono">Initializing secure session...</p>
        </div>
      </div>
    </div>
  );
}
