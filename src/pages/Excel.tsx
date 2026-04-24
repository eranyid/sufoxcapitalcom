import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Check, RefreshCw, FileSpreadsheet, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchExcelPayload, formatCell, rowsToTSV, rowsToCSV, rowsToJSON,
  TRANSACTIONS_COLS, VALUATIONS_COLS, COMPANIES_COLS, RESEARCH_COLS, DECISIONS_COLS,
  REQUIRED_COLS, getMissingFields,
  type ExcelPayload, type Row,
} from '@/lib/excelExportData';
import { buildCursorPrompt } from '@/lib/cursorPrompt';

type SheetKey = 'transactions' | 'valuations' | 'companies' | 'research' | 'decisions';

const SHEETS: Record<SheetKey, { label: string; cols: string[]; pick: (p: ExcelPayload) => Row[] }> = {
  transactions: { label: 'Transactions', cols: TRANSACTIONS_COLS, pick: (p) => p.data.transactions },
  valuations:   { label: 'Valuations',   cols: VALUATIONS_COLS,   pick: (p) => p.data.valuations },
  companies:    { label: 'Companies',    cols: COMPANIES_COLS,    pick: (p) => p.data.companies },
  research:     { label: 'Research',     cols: RESEARCH_COLS,     pick: (p) => p.data.research_entries },
  decisions:    { label: 'Decisions',    cols: DECISIONS_COLS,    pick: (p) => p.data.decisions },
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        const ok = await copyToClipboard(getText());
        if (ok) {
          setCopied(true);
          toast.success(`Copied ${label}`);
          setTimeout(() => setCopied(false), 1500);
        } else {
          toast.error('Copy failed — select the text manually and use Ctrl+C');
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

function SheetView({ sheet, payload }: { sheet: SheetKey; payload: ExcelPayload }) {
  const { cols, pick, label } = SHEETS[sheet];
  const rows = useMemo(() => pick(payload), [pick, payload]);
  const tsv = useMemo(() => rowsToTSV(rows, cols), [rows, cols]);
  const csv = useMemo(() => rowsToCSV(rows, cols), [rows, cols]);
  const json = useMemo(() => rowsToJSON(rows, cols), [rows, cols]);

  const selectAllInTable = () => {
    const el = document.getElementById(`excel-table-${sheet}`);
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    toast.info('Table selected — press Ctrl+C / Cmd+C to copy');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">{label}</h3>
          <Badge variant="secondary">{rows.length.toLocaleString()} rows</Badge>
          <Badge variant="outline">{cols.length} cols</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton getText={() => tsv} label="Copy TSV (best for Excel)" />
          <CopyButton getText={() => csv} label="Copy CSV" />
          <CopyButton getText={() => json} label="Copy JSON" />
          <Button size="sm" variant="ghost" onClick={selectAllInTable}>
            Select all in table
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-auto max-h-[65vh]">
        <table id={`excel-table-${sheet}`} className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-muted/95 backdrop-blur z-10">
            <tr className="border-b border-border">
              {cols.map((c) => (
                <th key={c} className="px-2 py-1.5 text-left font-semibold text-foreground/90 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-3 py-8 text-center text-muted-foreground">
                  No rows in this sheet for the active context.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={(r.id as string) ?? i} className="border-b border-border/60 hover:bg-muted/40">
                  {cols.map((c) => {
                    const v = formatCell(c, r[c]);
                    return (
                      <td key={c} className="px-2 py-1 align-top whitespace-nowrap text-foreground">
                        {v.length > 80 ? <span title={v}>{v.slice(0, 80)}…</span> : v}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Excel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session } = useSession();
  const [payload, setPayload] = useState<ExcelPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<SheetKey>('transactions');

  const activeClientId = session.scope === 'client' ? session.clientId : null;
  const activeClientName = session.clientName;

  const load = async () => {
    if (!user || !session.scope) return;
    const scope = session.scope;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchExcelPayload({
        userId: user.id,
        scope,
        clientId: activeClientId,
      });
      setPayload(p);
      toast.success('Data loaded');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session.scope) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session.scope, activeClientId]);

  const cursorPrompt = useMemo(() => (payload ? buildCursorPrompt(payload) : ''), [payload]);

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      <Helmet>
        <title>Excel View — SUFOX Capital</title>
        <meta name="description" content="Copy-friendly tabular view of your portfolio data, ready to paste into Excel or Google Sheets." />
      </Helmet>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              Excel View
            </h1>
            <p className="text-sm text-muted-foreground">
              Copy-friendly tables. Paste straight into Excel / Google Sheets — no file download required.
            </p>
          </div>
        </div>
        <Button onClick={load} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active scope</CardTitle>
          <CardDescription>
            {payload ? (
              <>
                {payload.scope.type === 'personal' ? 'Personal context' : `Client: ${activeClientName ?? payload.scope.client_id}`}
                {' · '}Exported {new Date(payload.exported_at).toLocaleString()}
              </>
            ) : loading ? 'Loading…' : 'Waiting for data…'}
          </CardDescription>
        </CardHeader>
      </Card>

      {payload && (
        <Card>
          <CardHeader>
            <CardTitle>Data sheets</CardTitle>
            <CardDescription>
              Use <strong>Copy TSV</strong> for the cleanest paste into Excel — columns map to cells automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as SheetKey)}>
              <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                {(Object.keys(SHEETS) as SheetKey[]).map((k) => (
                  <TabsTrigger key={k} value={k}>
                    {SHEETS[k].label}
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {SHEETS[k].pick(payload).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(SHEETS) as SheetKey[]).map((k) => (
                <TabsContent key={k} value={k} className="mt-4">
                  <SheetView sheet={k} payload={payload} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {payload && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Cursor Prompt
                </CardTitle>
                <CardDescription>
                  Paste this into Cursor to scaffold an external app that ingests your SUFOX data with the exact same schema.
                </CardDescription>
              </div>
              <CopyButton getText={() => cursorPrompt} label="Copy Prompt" />
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono bg-muted/40 border border-border rounded-md p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap">
              {cursorPrompt}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
