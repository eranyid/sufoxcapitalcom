import TradingViewStockHeatmap from '@/components/dashboard/TradingViewStockHeatmap';

const Test = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Stock Heatmap</h1>
      <div className="rounded border border-border overflow-hidden">
        <TradingViewStockHeatmap />
      </div>
    </div>
  );
};

export default Test;
