import { useState, useMemo } from "react";
import {
    Search,
    TrendingUp,
    Database,
    Filter,
    X,
    ChevronDown,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
}

interface QuoteRecord {
    timestamp_minute: string;
    price: number;
}

const MARKET_CAP_RANGES = [
    { label: 'All', value: 'all' },
    { label: 'Mega (>$200B)', value: 'mega' },
    { label: 'Large ($10B–$200B)', value: 'large' },
    { label: 'Mid ($2B–$10B)', value: 'mid' },
    { label: 'Small (<$2B)', value: 'small' },
];

function matchesMarketCap(cap: number, range: string): boolean {
    const b = cap / 1e9;
    switch (range) {
        case 'mega': return b >= 200;
        case 'large': return b >= 10 && b < 200;
        case 'mid': return b >= 2 && b < 10;
        case 'small': return b < 2;
        default: return true;
    }
}

export default function QuantUniverse() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sectorFilter, setSectorFilter] = useState("all");
    const [marketCapFilter, setMarketCapFilter] = useState("all");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<QuantUniverseItem | null>(null);

    const { data: universe, isLoading } = useQuery({
        queryKey: ['quant_universe_full'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('quant_universe' as any)
                .select('*')
                .eq('is_active', true)
                .order('market_cap_rank', { ascending: true });
            if (error) throw error;
            return data as unknown as QuantUniverseItem[];
        },
    });

    const { data: priceHistory, isLoading: loadingHistory } = useQuery({
        queryKey: ['quant_price_history', selectedSymbol?.symbol],
        queryFn: async () => {
            if (!selectedSymbol) return [];
            const { data, error } = await supabase
                .from('quant_quotes' as any)
                .select('timestamp_minute, price')
                .eq('symbol', selectedSymbol.symbol)
                .order('timestamp_minute', { ascending: true })
                .limit(500);
            if (error) throw error;
            return (data as unknown as QuoteRecord[]) || [];
        },
        enabled: !!selectedSymbol,
    });

    // Extract unique sectors for filter
    const sectors = useMemo(() => {
        if (!universe) return [];
        const unique = [...new Set(universe.map(i => i.sector).filter(Boolean))].sort();
        return unique;
    }, [universe]);

    // Apply filters
    const filtered = useMemo(() => {
        return universe?.filter((item) => {
            const matchesSearch = !searchQuery ||
                item.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sector?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSector = sectorFilter === 'all' || item.sector === sectorFilter;
            const matchesCap = matchesMarketCap(Number(item.market_cap), marketCapFilter);
            return matchesSearch && matchesSector && matchesCap;
        });
    }, [universe, searchQuery, sectorFilter, marketCapFilter]);

    const activeFilterCount = [sectorFilter !== 'all', marketCapFilter !== 'all'].filter(Boolean).length;

    const chartData = priceHistory?.map((q) => ({
        time: format(new Date(q.timestamp_minute), "MM/dd HH:mm"),
        price: Number(q.price),
    })) || [];

    const clearFilters = () => {
        setSectorFilter('all');
        setMarketCapFilter('all');
        setSearchQuery('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Stock Universe</h2>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                    {universe?.length || 0} symbols · Top 900 US
                </Badge>
            </div>

            {/* Search + filter bar */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search symbol, company, or sector..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                                <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </Collapsible>

                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                            <X className="h-3 w-3" /> Clear
                        </Button>
                    )}

                    <span className="text-xs text-muted-foreground ml-auto">
                        Showing {filtered?.length || 0} of {universe?.length || 0}
                    </span>
                </div>

                {/* Filter panel */}
                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <CollapsibleContent>
                        <Card className="border-dashed">
                            <CardContent className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Sector</label>
                                        <Select value={sectorFilter} onValueChange={setSectorFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Sectors" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sectors</SelectItem>
                                                {sectors.map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Market Cap</label>
                                        <Select value={marketCapFilter} onValueChange={setMarketCapFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Sizes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MARKET_CAP_RANGES.map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="max-h-[calc(100vh-320px)] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px] sticky top-0 bg-card z-10">Rank</TableHead>
                                    <TableHead className="sticky top-0 bg-card z-10">Symbol</TableHead>
                                    <TableHead className="sticky top-0 bg-card z-10">Company</TableHead>
                                    <TableHead className="sticky top-0 bg-card z-10">Sector</TableHead>
                                    <TableHead className="sticky top-0 bg-card z-10">Market Cap</TableHead>
                                    <TableHead className="sticky top-0 bg-card z-10">Last Price</TableHead>
                                    <TableHead className="sticky top-0 bg-card z-10 w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7}>
                                                <div className="h-4 bg-muted/50 rounded animate-pulse" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filtered?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            {searchQuery || activeFilterCount > 0
                                                ? "No symbols match your filters"
                                                : "Universe is empty. Run a metadata refresh to populate."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered?.map((item) => (
                                        <TableRow key={item.id} className="group">
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {item.market_cap_rank || item.rank}
                                            </TableCell>
                                            <TableCell className="font-bold text-sm">{item.symbol}</TableCell>
                                            <TableCell className="text-sm">{item.company_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{item.sector}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                ${(Number(item.market_cap) / 1e9).toFixed(1)}B
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
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
