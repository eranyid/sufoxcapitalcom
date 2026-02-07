import { Globe } from 'lucide-react';

const CountryMetadata = () => {
  return (
    <div className="w-full bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          COUNTRY METADATA
        </span>
        <span className="ml-auto text-[9px] text-muted-foreground">
          Source: TradingEconomics
        </span>
      </div>

      {/* TradingEconomics Widget */}
      <div className="w-full">
        <iframe
          src="https://tradingeconomics.com/united-states/indicators?embed=y&theme=darkly"
          width="100%"
          height="420"
          style={{ border: 'none' }}
          title="Country Metadata – United States"
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default CountryMetadata;
