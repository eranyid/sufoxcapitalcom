import { useState } from "react";
import { ArrowLeft, Search, Database, RefreshCw } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuantIcon } from "@/components/icons/QuantIcon";

interface QuantUniverseItem {
  id: string;
  rank: number;
  symbol: string;
  company_name: string;
  sector: string;
  market_cap: number;
  last_price?: number;
  status: string;
  market_cap_rank?: number;
  is_active?: boolean;
}

export default function QuantUniverse() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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
              S&P 500 constituents tracked by the Quant module
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
                  <TableHead className="sticky top-0 bg-card">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <div className="h-4 bg-muted/50 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {searchQuery
                        ? "No symbols match your search"
                        : "Universe is empty. Run a metadata refresh to populate."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((item) => (
                    <TableRow key={item.id}>
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
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                        >
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
