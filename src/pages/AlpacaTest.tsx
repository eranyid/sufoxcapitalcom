import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2, Zap } from "lucide-react";

type AlpacaAction = "latest-trade" | "latest-quote" | "latest-bar" | "historical-bars" | "historical-trades" | "historical-quotes" | "snapshot";

interface AlpacaResponse {
  status: string;
  message?: string;
  action?: string;
  symbol?: string;
  data?: unknown;
  isHealthy: boolean;
  latency_ms: number;
  latency_threshold_ms?: number;
  alpaca_status?: number;
  alpaca_error?: string;
}

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
  const [result, setResult] = useState<AlpacaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [action, setAction] = useState<AlpacaAction>("latest-trade");
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1Day");
  const [limit, setLimit] = useState("10");

  const runConnectionTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('alpaca-test', {
        body: { action, symbol, timeframe, limit: parseInt(limit, 10) },
      });

      if (fnError) {
        setError(fnError.message);
        return;
      }

      setResult(data as AlpacaResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const showTimeframe = ["latest-bar", "historical-bars"].includes(action);
  const showLimit = action.startsWith("historical-");

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", maxWidth: "900px" }}>
      <h1 style={{ marginBottom: "8px" }}>Alpaca API Connection Test</h1>
      <p style={{ marginBottom: "20px", opacity: 0.7, fontSize: "14px" }}>
        Validates API credentials, measures latency, and checks endpoint reliability
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: "180px" }}>
            <label style={{ fontSize: "12px", marginBottom: "4px", display: "block" }}>Action</label>
            <Select value={action} onValueChange={(v) => setAction(v as AlpacaAction)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} min="1" max="10000" />
            </div>
          )}

          <Button onClick={runConnectionTest} disabled={loading || !symbol.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Connection Test"
            )}
          </Button>
        </div>
      </div>

      {/* Health Status Banner */}
      {result && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "16px",
            background: result.isHealthy ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${result.isHealthy ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
          }}
        >
          {result.isHealthy ? (
            <CheckCircle style={{ color: "#22c55e", width: 24, height: 24 }} />
          ) : (
            <XCircle style={{ color: "#ef4444", width: 24, height: 24 }} />
          )}
          <div>
            <div style={{ fontWeight: 600, color: result.isHealthy ? "#22c55e" : "#ef4444" }}>
              {result.isHealthy ? "Connection Healthy" : "Connection Unhealthy"}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              {result.status === "success" 
                ? `Endpoint responded successfully` 
                : result.message || "Failed to connect"}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Zap style={{ width: 14, height: 14 }} />
              <span style={{ fontWeight: 600, fontSize: "18px" }}>{result.latency_ms}ms</span>
            </div>
            <div style={{ fontSize: "11px", opacity: 0.6 }}>
              Threshold: {result.latency_threshold_ms || 800}ms
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: "12px 16px", 
          background: "rgba(239, 68, 68, 0.15)", 
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          <strong style={{ color: "#ef4444" }}>Error:</strong> {error}
        </div>
      )}

      {/* JSON Response */}
      {result && (
        <div>
          <div style={{ fontSize: "12px", marginBottom: "8px", opacity: 0.7 }}>Response Data</div>
          <pre style={{ 
            background: "#0a0a0a", 
            padding: "16px", 
            borderRadius: "6px",
            overflow: "auto",
            color: "#22c55e",
            maxHeight: "400px",
            border: "1px solid #222",
            fontSize: "13px",
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AlpacaTest;
