const GRID_DELAYS = [0, 75, 150, 225, 300, 375, 450, 525, 600];

function GridLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
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
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return <GridLoader />;
}

export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <GridLoader />
        <div className="space-y-2">
          <p className="text-primary font-mono text-sm tracking-wider">SUFOX CAPITAL</p>
          <p className="text-muted-foreground text-xs font-mono">Initializing secure session...</p>
        </div>
      </div>
    </div>
  );
}
