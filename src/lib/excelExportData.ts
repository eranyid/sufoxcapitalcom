import { supabase } from '@/integrations/supabase/client';

export type Row = Record<string, unknown>;

export type ExcelPayload = {
  exported_at: string;
  scope: { type: 'personal' | 'client'; client_id: string | null };
  data: {
    transactions: Row[];
    valuations: Row[];
    companies: Row[];
    research_entries: Row[];
    decisions: Row[];
    capital_ledger: Row[];
  };
};

export const TRANSACTIONS_COLS = [
  'date', 'ticker', 'asset_name', 'asset_type', 'transaction_type',
  'quantity', 'price_per_unit', 'fees', 'currency',
  'cost_local', 'cost_base', 'base_currency', 'fx_rate_at_entry',
  'cash_impact_currency', 'cash_impact_amount',
  'realized_pl_base', 'realized_fx_pl', 'geography', 'inception_year',
  'linked_company_id', 'client_id', 'id', 'created_at', 'updated_at',
];

export const VALUATIONS_COLS = [
  'month', 'ticker', 'asset_name', 'asset_id', 'price_per_unit',
  'fx_rate', 'yield_to_maturity', 'coupon_rate', 'duration',
  'accrued_interest', 'maturity_date', 'linked_company_id',
  'client_id', 'id', 'created_at', 'updated_at',
];

export const COMPANIES_COLS = [
  'ticker', 'company_name', 'asset_type', 'sector', 'geography',
  'status', 'group_name', 'confidence_level', 'market_cap', 'inception_year',
  'employee_count', 'investment_thesis', 'thesis_summary', 'why_we_own',
  'time_horizon', 'valuation_logic', 'exit_criteria', 'key_risks',
  'business_description', 'notes', 'timeline_start', 'timeline_end',
  'project_id', 'client_id', 'id', 'created_at', 'updated_at',
];

export const RESEARCH_COLS = [
  'created_at', 'ticker', 'company_id', 'entry_type', 'title',
  'calculator_type', 'output_summary', 'inputs_json', 'outputs_json',
  'question_text', 'visibility', 'tags', 'related_holding_id',
  'id', 'updated_at',
];

export const DECISIONS_COLS = [
  'decision_date', 'ticker', 'company_id', 'decision_type', 'direction',
  'size_change', 'size_unit', 'confidence', 'rationale',
  'key_assumptions', 'expected_outcome', 'catalyst_timeline',
  'risks_breaks_thesis', 'tags', 'id', 'created_at', 'updated_at',
];

export const CAPITAL_LEDGER_COLS = [
  'created_at', 'entry_type', 'currency', 'amount',
  'running_balance', 'fx_rate_used', 'base_currency', 'amount_base',
  'description', 'transaction_id', 'metadata',
  'client_id', 'id',
];

/**
 * Required columns per sheet for client-side validation.
 * A row is "invalid" if any of these fields is null/undefined/empty string.
 * Mirrors the NOT NULL constraints in the database schema for the relevant tables.
 */
export const REQUIRED_COLS: Record<string, string[]> = {
  transactions:   ['date', 'ticker', 'transaction_type', 'quantity', 'price_per_unit', 'currency'],
  valuations:     ['month', 'ticker', 'price_per_unit'],
  companies:      ['company_name', 'status', 'group_name'],
  research:       ['title', 'entry_type'],
  decisions:      ['decision_date', 'decision_type', 'rationale'],
  capital_ledger: ['created_at', 'entry_type', 'currency', 'amount'],
};

/** Returns true when a value is considered "missing" for validation purposes. */
export function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return false; // empty array is OK
  return false;
}

/** Returns the list of required fields missing from a row, given a sheet's required cols. */
export function getMissingFields(row: Row, requiredCols: string[]): string[] {
  return requiredCols.filter((c) => isMissing(row[c]));
}

const DATE_FIELDS = new Set([
  'date', 'created_at', 'updated_at', 'deleted_at',
  'rate_date', 'price_date', 'decision_date',
  'timeline_start', 'timeline_end', 'maturity_date',
  'due_date', 'start_at', 'end_at', 'month',
]);

const JSON_FIELDS = new Set([
  'inputs_json', 'outputs_json', 'metadata', 'details',
  'answers_json', 'shocks', 'geographic_limits',
  'regulatory_constraints', 'hard_constraints', 'soft_constraints',
  'analysis_snapshot', 'raw_payload',
]);

/** Format a value as a clean string for tables / TSV / CSV. Stable, paste-into-Excel friendly. */
export function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (JSON_FIELDS.has(key) && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  if (Array.isArray(value)) return value.join(', ');
  if (DATE_FIELDS.has(key) && typeof value === 'string' && value.length >= 8) {
    // Keep YYYY-MM-DD for date-only fields, or ISO for timestamps
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      // If original looks like a pure date (no T), keep as date-only
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      // Otherwise return ISO trimmed to seconds
      return d.toISOString().replace('T', ' ').slice(0, 19);
    }
  }
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

export function rowsToTSV(rows: Row[], cols: string[]): string {
  const sanitize = (s: string) => s.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
  const header = cols.join('\t');
  const body = rows.map(r => cols.map(c => sanitize(formatCell(c, r[c]))).join('\t')).join('\n');
  return rows.length ? `${header}\n${body}` : header;
}

export function rowsToCSV(rows: Row[], cols: string[]): string {
  const escape = (s: string) => {
    if (/[\",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = cols.map(escape).join(',');
  const body = rows.map(r => cols.map(c => escape(formatCell(c, r[c]))).join(',')).join('\n');
  return rows.length ? `${header}\n${body}` : header;
}

export function rowsToJSON(rows: Row[], cols: string[]): string {
  const projected = rows.map(r => {
    const out: Row = {};
    for (const c of cols) out[c] = r[c] ?? null;
    return out;
  });
  return JSON.stringify(projected, null, 2);
}

export async function fetchExcelPayload(params: {
  userId: string;
  scope: 'personal' | 'client';
  clientId: string | null;
}): Promise<ExcelPayload> {
  const { userId, scope, clientId } = params;

  let companiesQuery = supabase.from('crm_companies').select('*').eq('user_id', userId).is('deleted_at', null);
  let valuationsQuery = supabase.from('valuations').select('*').eq('user_id', userId).is('deleted_at', null);
  let transactionsQuery = supabase.from('transactions').select('*').eq('user_id', userId).is('deleted_at', null);
  let ledgerQuery = supabase.from('capital_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: true });

  if (clientId) {
    companiesQuery = companiesQuery.eq('client_id', clientId);
    valuationsQuery = valuationsQuery.eq('client_id', clientId);
    transactionsQuery = transactionsQuery.eq('client_id', clientId);
    ledgerQuery = ledgerQuery.eq('client_id', clientId);
  } else {
    companiesQuery = companiesQuery.is('client_id', null);
    valuationsQuery = valuationsQuery.is('client_id', null);
    transactionsQuery = transactionsQuery.is('client_id', null);
    ledgerQuery = ledgerQuery.is('client_id', null);
  }

  const [companiesRes, valuationsRes, transactionsRes, researchRes, decisionsRes, ledgerRes] = await Promise.all([
    companiesQuery,
    valuationsQuery,
    transactionsQuery,
    supabase.from('company_research_entries').select('*').eq('user_id', userId),
    supabase.from('company_decisions').select('*').eq('user_id', userId),
    ledgerQuery,
  ]);

  if (companiesRes.error) throw companiesRes.error;
  if (valuationsRes.error) throw valuationsRes.error;
  if (transactionsRes.error) throw transactionsRes.error;
  if (researchRes.error) throw researchRes.error;
  if (decisionsRes.error) throw decisionsRes.error;
  if (ledgerRes.error) throw ledgerRes.error;

  const companies = (companiesRes.data ?? []) as Row[];
  const valuations = (valuationsRes.data ?? []) as Row[];
  const transactions = (transactionsRes.data ?? []) as Row[];
  const researchAll = (researchRes.data ?? []) as Row[];
  const decisionsAll = (decisionsRes.data ?? []) as Row[];
  const capital_ledger = (ledgerRes.data ?? []) as Row[];

  const companyIds = new Set(companies.map(c => c.id as string));
  const tickers = new Set<string>([
    ...companies.map(c => c.ticker as string | null),
    ...valuations.map(v => v.ticker as string | null),
    ...transactions.map(t => t.ticker as string | null),
  ].filter((t): t is string => Boolean(t)));

  const research_entries = researchAll.filter(r => {
    if (r.company_id && companyIds.has(r.company_id as string)) return true;
    if (!r.company_id && r.ticker && tickers.has(r.ticker as string)) return true;
    return false;
  });

  const decisions = decisionsAll.filter(d => {
    if (companyIds.has(d.company_id as string)) return true;
    if (d.ticker && tickers.has(d.ticker as string)) return true;
    return false;
  });

  return {
    exported_at: new Date().toISOString(),
    scope: { type: scope, client_id: clientId },
    data: { transactions, valuations, companies, research_entries, decisions, capital_ledger },
  };
}
