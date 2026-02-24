import { useState } from "react";
import { ArrowLeft, Search, Database, RefreshCw, TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuantIcon } from "@/components/icons/QuantIcon";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface QuantUniverseItem {
  id: string;
  rank: number;
  symbol: string;
  company_name: string;
  sector: string;
  market_cap: number;
  last_price?: number;
  last_price_date?: string;
  status: string;
  market_cap_rank?: number;
  is_active?: boolean;
}

interface QuoteRecord {
  timestamp_minute: string;
  price: number;
}

export default function QuantUniverse() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<QuantUniverseItem | null>(null);

  const { data: universe, isLoading } = useQuery({
    queryKey: ["quant_universe_full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quant_universe" as any)
        .select("*")
        .eq("is_active", true)
        .order("market_cap_rank", { ascending: true });
      if (error) throw error;
      return data as unknown as QuantUniverseItem[];
    },
  });

  const { data: priceHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["quant_price_history", selectedSymbol?.symbol],
    queryFn: async () => {
      if (!selectedSymbol) return [];
      const { data, error } = await supabase
        .from("quant_quotes" as any)
        .select("timestamp_minute, price")
        .eq("symbol", selectedSymbol.symbol)
        .order("timestamp_minute", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data as unknown as QuoteRecord[]) || [];
    },
    enabled: !!selectedSymbol,
  });

  const filtered = universe?.filter(
    (item) =>
      !searchQuery ||
      item.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sector?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    toast.info("Triggering universe refresh...");
  };

  // Group price history by date for display
  const chartData = priceHistory?.map((q) => ({
    time: format(new Date(q.timestamp_minute), "MM/dd HH:mm"),
    price: Number(q.price),
  })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/quant")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <QuantIcon size={22} />
              Stock Universe
            </h1>
            <p className="text-sm text-muted-foreground">
              Top 900 US stocks tracked by the Quant module
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {universe?.length || 0} symbols
          </Badge>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Universe
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbol, company, or sector..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              Showing {filtered?.length || 0} of {universe?.length || 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Universe Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4" />
            Active Universe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-320px)] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] sticky top-0 bg-card">Rank</TableHead>
                  <TableHead className="sticky top-0 bg-card">Symbol</TableHead>
                  <TableHead className="sticky top-0 bg-card">Company</TableHead>
                  <TableHead className="sticky top-0 bg-card">Sector</TableHead>
                  <TableHead className="sticky top-0 bg-card">Market Cap</TableHead>
                  <TableHead className="sticky top-0 bg-card">Last Price</TableHead>
                  <TableHead className="sticky top-0 bg-card w-[60px]">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <div className="h-4 bg-muted/50 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {searchQuery
                        ? "No symbols match your search"
                        : "Universe is empty. Run a metadata refresh to populate."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell className="font-mono text-muted-foreground">
                        {item.market_cap_rank || item.rank}
                      </TableCell>
                      <TableCell className="font-bold">{item.symbol}</TableCell>
                      <TableCell>{item.company_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.sector}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        ${(Number(item.market_cap) / 1e9).toFixed(1)}B
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.last_price ? `$${Number(item.last_price).toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 group-hover:opacity-100"
                          onClick={() => setSelectedSymbol(item)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Price History Dialog */}
      <Dialog open={!!selectedSymbol} onOpenChange={(o) => !o && setSelectedSymbol(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {selectedSymbol?.symbol} — {selectedSymbol?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Collected price history from Quant ingestion sessions
            </p>
            {loadingHistory ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No price history yet for {selectedSymbol?.symbol}
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {chartData.length > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{chartData.length} data points</span>
                <span>First: {chartData[0]?.time} · Last: {chartData[chartData.length - 1]?.time}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
