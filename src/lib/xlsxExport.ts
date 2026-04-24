import * as XLSX from 'xlsx';

type Row = Record<string, unknown>;

const DATE_FIELDS = new Set([
  'date', 'created_at', 'updated_at', 'deleted_at',
  'rate_date', 'price_date', 'decision_date',
  'timeline_start', 'timeline_end', 'maturity_date',
  'due_date', 'start_at', 'end_at',
]);

const JSON_FIELDS = new Set([
  'inputs_json', 'outputs_json', 'metadata', 'details',
  'answers_json', 'shocks', 'geographic_limits',
  'regulatory_constraints', 'hard_constraints', 'soft_constraints',
  'analysis_snapshot', 'raw_payload',
]);

function normalizeCell(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (JSON_FIELDS.has(key) && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  if (Array.isArray(value)) return value.join(', ');
  if (DATE_FIELDS.has(key) && typeof value === 'string' && value.length >= 8) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return value;
}

function buildSheet(rows: Row[], preferredColumns?: string[]): XLSX.WorkSheet {
  if (!rows.length) {
    const empty = XLSX.utils.aoa_to_sheet([['(no data)']]);
    return empty;
  }

  // Determine column order: preferred first, then any extras encountered
  const allKeys = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));
  const columns = preferredColumns
    ? [...preferredColumns.filter((c) => allKeys.has(c)), ...Array.from(allKeys).filter((k) => !preferredColumns.includes(k))]
    : Array.from(allKeys);

  const normalizedRows = rows.map((r) => {
    const out: Row = {};
    for (const col of columns) out[col] = normalizeCell(col, r[col]);
    return out;
  });

  const sheet = XLSX.utils.json_to_sheet(normalizedRows, { header: columns, cellDates: true });

  // Column widths: clamp to [10, 60]
  const widths = columns.map((col) => {
    const headerLen = col.length;
    let maxLen = headerLen;
    for (const row of normalizedRows) {
      const v = row[col];
      const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '');
      if (s.length > maxLen) maxLen = s.length;
      if (maxLen >= 60) break;
    }
    return { wch: Math.max(10, Math.min(60, maxLen + 2)) };
  });
  sheet['!cols'] = widths;
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as XLSX.WorkSheet['!freeze'];
  // Standard freeze pane via views
  sheet['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2', activePane: 'bottomLeft' }] as unknown as XLSX.WorkSheet['!views'];

  return sheet;
}

export type WorkbookPayload = {
  exported_at: string;
  scope: { type: 'personal' | 'client'; client_id: string | null };
  data: {
    transactions: Row[];
    value_data: Row[];
    analyses: { companies: Row[]; research_entries: Row[]; decisions: Row[] };
  };
};

const TRANSACTIONS_COLS = [
  'date', 'ticker', 'asset_name', 'asset_type', 'transaction_type',
  'quantity', 'price_per_unit', 'fees', 'currency',
  'cost_local', 'cost_base', 'base_currency', 'fx_rate_at_entry',
  'cash_impact_currency', 'cash_impact_amount',
  'realized_pl_base', 'realized_fx_pl', 'geography', 'inception_year',
  'linked_company_id', 'client_id', 'id', 'created_at', 'updated_at',
];

const VALUATIONS_COLS = [
  'month', 'ticker', 'asset_name', 'asset_id', 'price_per_unit',
  'fx_rate', 'yield_to_maturity', 'coupon_rate', 'duration',
  'accrued_interest', 'maturity_date', 'linked_company_id',
  'client_id', 'id', 'created_at', 'updated_at',
];

const COMPANIES_COLS = [
  'ticker', 'company_name', 'asset_type', 'sector', 'geography',
  'status', 'group_name', 'confidence_level', 'market_cap', 'inception_year',
  'employee_count', 'investment_thesis', 'thesis_summary', 'why_we_own',
  'time_horizon', 'valuation_logic', 'exit_criteria', 'key_risks',
  'business_description', 'notes', 'timeline_start', 'timeline_end',
  'project_id', 'client_id', 'id', 'created_at', 'updated_at',
];

const RESEARCH_COLS = [
  'created_at', 'ticker', 'company_id', 'entry_type', 'title',
  'calculator_type', 'output_summary', 'inputs_json', 'outputs_json',
  'question_text', 'visibility', 'tags', 'related_holding_id',
  'id', 'updated_at',
];

const DECISIONS_COLS = [
  'decision_date', 'ticker', 'company_id', 'decision_type', 'direction',
  'size_change', 'size_unit', 'confidence', 'rationale',
  'key_assumptions', 'expected_outcome', 'catalyst_timeline',
  'risks_breaks_thesis', 'tags', 'id', 'created_at', 'updated_at',
];

export function buildWorkbook(payload: WorkbookPayload): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const counts = {
    Transactions: payload.data.transactions.length,
    Valuations: payload.data.value_data.length,
    Analyses_Companies: payload.data.analyses.companies.length,
    Analyses_Research: payload.data.analyses.research_entries.length,
    Analyses_Decisions: payload.data.analyses.decisions.length,
  };

  // README sheet
  const readme: (string | number)[][] = [
    ['SUFOX Capital — Data Export'],
    [],
    ['Exported at', payload.exported_at],
    ['Scope type', payload.scope.type],
    ['Client ID', payload.scope.client_id ?? '(personal)'],
    [],
    ['Sheet', 'Row count', 'Description'],
    ['Transactions', counts.Transactions, 'All buy/sell transactions for the active context'],
    ['Valuations', counts.Valuations, 'Monthly price/FX valuations per asset'],
    ['Analyses_Companies', counts.Analyses_Companies, 'Companies tracked in the Analysis module'],
    ['Analyses_Research', counts.Analyses_Research, 'Research notes and calculator outputs per company'],
    ['Analyses_Decisions', counts.Analyses_Decisions, 'Investment decision log entries'],
    [],
    ['Notes'],
    ['• Dates are stored as Excel date values.'],
    ['• JSON columns (inputs_json, outputs_json, metadata) are stored as compact JSON strings.'],
    ['• Soft-deleted records are excluded.'],
    ['• Only the active context (personal or selected client) is included.'],
    ['• This file is ready to import into BI tools (Power BI, Tableau, Looker), CRMs, and external systems.'],
  ];
  const readmeSheet = XLSX.utils.aoa_to_sheet(readme);
  readmeSheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, readmeSheet, 'README');

  XLSX.utils.book_append_sheet(wb, buildSheet(payload.data.transactions, TRANSACTIONS_COLS), 'Transactions');
  XLSX.utils.book_append_sheet(wb, buildSheet(payload.data.value_data, VALUATIONS_COLS), 'Valuations');
  XLSX.utils.book_append_sheet(wb, buildSheet(payload.data.analyses.companies, COMPANIES_COLS), 'Analyses_Companies');
  XLSX.utils.book_append_sheet(wb, buildSheet(payload.data.analyses.research_entries, RESEARCH_COLS), 'Analyses_Research');
  XLSX.utils.book_append_sheet(wb, buildSheet(payload.data.analyses.decisions, DECISIONS_COLS), 'Analyses_Decisions');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

export function workbookToBlob(payload: WorkbookPayload): Blob {
  const buf = buildWorkbook(payload);
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
