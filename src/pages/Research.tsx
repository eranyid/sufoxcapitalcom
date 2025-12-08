import { Search, Eye, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import TradingViewTickerTape from '@/components/dashboard/TradingViewTickerTape';
import { EfficientFrontier } from '@/components/dashboard/EfficientFrontier';
import { useResearchWatchlist } from '@/hooks/useResearchWatchlist';
import { Button } from '@/components/ui/button';

const Research = () => {
  const { items, isLoading } = useResearchWatchlist();
  const hasWatchlist = items.length > 0;

  return (
    <div className="animate-fade-in">
      {/* TradingView Ticker Tape */}
      <TradingViewTickerTape />
      
      <div className="section-spacing">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-mono text-foreground tracking-tight">RESEARCH</h1>
            {hasWatchlist && (
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-sm font-mono">
                {items.length} SYMBOLS
              </span>
            )}
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="h-7 text-xs font-mono">
              <Eye className="h-3 w-3 mr-1" />
              Manage Watchlist
            </Button>
          </Link>
        </div>

        {/* Empty Watchlist State */}
        {!isLoading && !hasWatchlist && (
          <div className="bloomberg-panel mb-6">
            <div className="p-8 text-center">
              <Eye className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium mb-2 text-primary">No Symbols in Research Watchlist</h3>
              <p className="text-muted-foreground text-xs max-w-md mx-auto mb-4">
                Add symbols to your Research Watchlist to use them across all analysis modules.
              </p>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="text-xs font-mono">
                  <Settings className="h-3 w-3 mr-1" />
                  Go to Settings → Watchlist
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Efficient Frontier Module */}
        <EfficientFrontier />
      </div>
    </div>
  );
};

export default Research;
