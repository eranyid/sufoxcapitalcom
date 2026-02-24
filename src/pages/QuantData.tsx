
import {
    Database,
    Search,
    Trash2,
    ArrowRight
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

// --- Types ---
interface QuantSession {
    id: string;
    session_date: string;
    status: string;
    quotes_collected: number;
    quotes_target: number;
    window_start_utc: string;
    window_end_utc: string;
    is_trading_day: boolean;
    failure_rate_pct: number;
}

interface QuantUniverseItem {
    id: string; // Added id matching DB
    rank: number;
    symbol: string;
    company_name: string;
    sector: string;
    market_cap: number;
    last_price?: number;
    status: string;
    market_cap_rank?: number; // Add optional property matching DB column
}

interface IngestionLog {
    id: string;
    minute_utc: string;
    symbols_attempted: string[];
    status: string;
    latency_ms: number;
    retry_count: number;
}

// --- Components ---

const KPIHeader = ({ session }: { session?: QuantSession }) => {
    const isRunning = session?.status === 'running';
    const progress = session ? Math.min(100, Math.round((session.quotes_collected / session.quotes_target) * 100)) : 0;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-card border-l-4 border-l-primary">
                <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground font-semibold uppercase">Today's Status</div>
                    <div className="text-lg font-bold flex items-center gap-2 mt-1">
                        {isRunning ? <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" /> : <span className="h-3 w-3 rounded-full bg-slate-500" />}
                        {session?.status.toUpperCase() || 'NO SESSION'}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground font-semibold uppercase">Quotes Collected</div>
                    <div className="text-lg font-bold mt-1">
                        {session?.quotes_collected || 0} <span className="text-muted-foreground text-sm font-normal">/ {session?.quotes_target || 900}</span>
                    </div>
                    <Progress value={progress} className="h-1.5 mt-2" />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground font-semibold uppercase">Window (ET)</div>
                    <div className="text-lg font-bold mt-1">
                        13:00 – 16:00
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground font-semibold uppercase">Universe Size</div>
                    <div className="text-lg font-bold mt-1">
                        500 <span className="text-muted-foreground text-sm font-normal">Active</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground font-semibold uppercase">Next Tick</div>
                    <div className="text-lg font-bold mt-1 font-mono">
                        00:43
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatusPanel = ({ session }: { session?: QuantSession }) => {
    const isRunning = session?.status === 'running';

    return (
        <Card className="mb-6">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                        <Database className="h-4 w-4" /> Data Ingestion
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {session && (
                            <Badge variant={isRunning ? 'default' : 'outline'} className={isRunning ? 'bg-emerald-600' : ''}>
                                {session.status?.toUpperCase()}
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Session: {format(new Date(), 'yyyy-MM-dd')}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                    Ingestion runs automatically via scheduled jobs. Data refreshes at 12:00 ET, sessions start at 13:00 ET.
                </p>
            </CardContent>
        </Card>
    );
};

const UniverseLinkCard = ({ universeCount }: { universeCount: number }) => {
    const navigate = useNavigate();
    return (
        <Card
            className="group cursor-pointer border-border/50 hover:border-primary/50 transition-colors"
            onClick={() => navigate('/quant/universe')}
        >
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Stock Universe
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                        {universeCount} symbols
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                    Browse and search the full stock universe with advanced filters by sector, market cap, and more.
                </p>
            </CardContent>
        </Card>
    );
};

const IngestionLogsPanel = ({ logs }: { logs?: IngestionLog[] }) => {
    return (
        <Card className="mb-6">
             <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Ingestion Logs</CardTitle>
                <Badge variant="outline" className="animate-pulse border-green-500 text-green-500">Live</Badge>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time (ET)</TableHead>
                            <TableHead>Symbols</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Latency</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs?.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-xs">
                                    {format(new Date(log.minute_utc), 'HH:mm:ss')}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {log.symbols_attempted.join(' · ')}
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={log.status === 'success' ? 'default' : 'destructive'}
                                        className={log.status === 'success' ? 'bg-green-500' : ''}
                                    >
                                        {log.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-mono">{log.latency_ms}ms</TableCell>
                            </TableRow>
                        ))}
                        {!logs?.length && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No logs for today yet
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const DataGovernancePanel = () => {
    return (
        <Card>
            <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Data Governance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground uppercase">Total Records</div>
                        <div className="text-2xl font-bold">184,320</div>
                    </div>
                     <div className="p-4 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground uppercase">Oldest Record</div>
                        <div className="text-2xl font-bold">Aug 14</div>
                    </div>
                     <div className="p-4 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground uppercase">Duplicate Status</div>
                        <div className="text-2xl font-bold text-green-500">Clean</div>
                    </div>
                     <div className="p-4 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground uppercase">Days Covered</div>
                        <div className="text-2xl font-bold">205</div>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                     <Button variant="outline" size="sm">
                         <Search className="h-4 w-4 mr-2" /> Run Duplicate Check
                     </Button>
                     <Button variant="outline" size="sm">
                         <Trash2 className="h-4 w-4 mr-2" /> Purge Old Logs
                     </Button>
                 </div>
            </CardContent>
        </Card>
    );
};

export default function Quant() {
    const queryClient = useQueryClient();

    // Realtime subscriptions — shared channels, no per-user filters
    useEffect(() => {
        const channel = supabase
            .channel('quant-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'quant_ingestion_sessions'
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['quant_session_today'] });
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'quant_ingestion_logs'
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['quant_logs_today'] });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [queryClient]);

    // Fetch session — no user_id filter, shared global data
    const { data: session } = useQuery({
        queryKey: ['quant_session_today'],
        queryFn: async () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data } = await supabase
                .from('quant_ingestion_sessions' as any)
                .select('*')
                .eq('session_date', today)
                .maybeSingle();
            return data as unknown as QuantSession;
        },
        refetchInterval: 30000
    });

    const { data: logs } = useQuery({
        queryKey: ['quant_logs_today'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const { data } = await supabase
                .from('quant_ingestion_logs' as any)
                .select('*')
                .gte('minute_utc', today.toISOString())
                .order('minute_utc', { ascending: false })
                .limit(20);
            return data as unknown as IngestionLog[];
        },
        refetchInterval: 30000
    });

    const { data: universe } = useQuery({
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

    return (
        <div className="space-y-6">
            <KPIHeader session={session} />
            <StatusPanel session={session} />
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <UniverseLinkCard universeCount={universe?.length || 0} />
                    <DataGovernancePanel />
                </div>
                <div>
                    <IngestionLogsPanel logs={logs} />
                </div>
            </div>
        </div>
    );
}
