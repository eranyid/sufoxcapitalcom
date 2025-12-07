import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AlpacaTest = () => {
  const [result, setResult] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAlpacaConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('alpaca-test');

      if (fnError) {
        setError(fnError.message);
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Alpaca API Connection Test</h1>
      
      <Button 
        onClick={testAlpacaConnection} 
        disabled={loading}
        style={{ marginTop: "20px" }}
      >
        {loading ? "Testing..." : "Test Alpaca Connection"}
      </Button>

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
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
          color: "#00ff00"
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default AlpacaTest;
