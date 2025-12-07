import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AlpacaAction = "latest-trade" | "latest-quote" | "latest-bar" | "historical-bars" | "historical-trades" | "historical-quotes" | "snapshot";

const ACTIONS: { value: AlpacaAction; label: string }[] = [
  { value: "latest-trade", label: "Latest Trade" },
  { value: "latest-quote", label: "Latest Quote" },
  { value: "latest-bar", label: "Latest Bar" },
  { value: "snapshot", label: "Snapshot (All Latest)" },
  { value: "historical-bars", label: "Historical Bars" },
  { value: "historical-trades", label: "Historical Trades" },
  { value: "historical-quotes", label: "Historical Quotes" },
];

const TIMEFRAMES = ["1Min", "5Min", "15Min", "30Min", "1Hour", "4Hour", "1Day", "1Week", "1Month"];

const AlpacaTest = () => {
  const [result, setResult] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [action, setAction] = useState<AlpacaAction>("latest-trade");
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1Day");
  const [limit, setLimit] = useState("10");

  const testAlpacaConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('alpaca-test', {
        body: {
          action,
          symbol,
          timeframe,
          limit: parseInt(limit, 10),
        },
      });

      if (fnError) {
        setError(fnError.message);
        return;
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const showTimeframe = ["latest-bar", "historical-bars"].includes(action);
  const showLimit = action.startsWith("historical-");

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", maxWidth: "800px" }}>
      <h1 style={{ marginBottom: "20px" }}>Alpaca API Connection Test</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: "180px" }}>
            <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Action</label>
            <Select value={action} onValueChange={(v) => setAction(v as AlpacaAction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div style={{ minWidth: "100px" }}>
            <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Symbol</label>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
            />
          </div>

          {showTimeframe && (
            <div style={{ minWidth: "120px" }}>
              <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showLimit && (
            <div style={{ minWidth: "80px" }}>
              <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Limit</label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min="1"
                max="10000"
              />
            </div>
          )}
        </div>

        <Button 
          onClick={testAlpacaConnection} 
          disabled={loading || !symbol.trim()}
        >
          {loading ? "Fetching..." : "Fetch Data"}
        </Button>
      </div>

      {error && (
        <div style={{ marginTop: "20px", color: "#ff4444", padding: "10px", background: "#1a1a1a", borderRadius: "4px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <pre style={{ 
          marginTop: "20px", 
          background: "#1a1a1a", 
          padding: "15px", 
          borderRadius: "4px",
          overflow: "auto",
          color: "#00ff00",
          maxHeight: "500px"
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default AlpacaTest;
