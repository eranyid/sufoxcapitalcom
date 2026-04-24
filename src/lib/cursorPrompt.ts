import {
  TRANSACTIONS_COLS, VALUATIONS_COLS, COMPANIES_COLS,
  RESEARCH_COLS, DECISIONS_COLS, type ExcelPayload,
} from './excelExportData';

const SCHEMA_DESCRIPTIONS: Record<string, string> = {
  // shared
  id: 'UUID primary key',
  user_id: 'UUID of owner',
  client_id: 'UUID of client context (null = personal)',
  created_at: 'ISO timestamp',
  updated_at: 'ISO timestamp',
  ticker: 'Asset ticker symbol (e.g. AAPL, MSFT)',
  // transactions
  date: 'Trade date (YYYY-MM-DD)',
  asset_name: 'Display name of the asset',
  asset_type: 'equity | bond | etf | fund | crypto | cash | alternative',
  transaction_type: 'BUY | SELL | DIVIDEND | DEPOSIT | WITHDRAWAL | FEE',
  quantity: 'Units traded (whole shares)',
  price_per_unit: 'Price per unit in asset currency',
  fees: 'Trade fees in asset currency',
  currency: 'Asset / trade currency (USD, EUR, ILS, GBP, CHF, JPY)',
  cost_local: 'Total cost in asset currency',
  cost_base: 'Total cost in base currency (USD)',
  base_currency: 'Reporting base currency (USD)',
  fx_rate_at_entry: 'FX rate (asset currency → USD) at trade time',
  cash_impact_currency: 'Currency of cash leg',
  cash_impact_amount: 'Signed cash impact (- = outflow)',
  realized_pl_base: 'Realized P&L in USD on SELL trades',
  realized_fx_pl: 'Realized FX P&L in USD',
  geography: 'Asset geographic exposure',
  inception_year: 'Year position was first opened',
  linked_company_id: 'FK → crm_companies.id (Analysis hub)',
  // valuations
  month: 'Month-end date (YYYY-MM-DD)',
  asset_id: 'Internal asset identifier',
  yield_to_maturity: 'YTM for fixed income',
  coupon_rate: 'Coupon rate %',
  duration: 'Duration in years',
  accrued_interest: 'Accrued interest at month-end',
  maturity_date: 'Maturity date for bonds',
  fx_rate: 'FX rate (asset → USD) at valuation date',
  // companies
  company_name: 'Legal/display name',
  sector: 'GICS sector or equivalent',
  status: 'research | active | exited | rejected',
  group_name: 'Pipeline group: potential | active | exited',
  confidence_level: 'Watchlist | Speculative | Tracking | Conviction | High | Core | Fortress',
  market_cap: 'Market cap bucket',
  employee_count: 'Number of employees',
  investment_thesis: 'Long-form thesis',
  thesis_summary: 'One-line thesis',
  why_we_own: 'Reason for owning',
  time_horizon: 'Expected holding period',
  valuation_logic: 'Valuation framework / target',
  exit_criteria: 'When to sell',
  key_risks: 'Top risks',
  business_description: 'What the company does',
  notes: 'Free-form notes',
  timeline_start: 'Coverage start (YYYY-MM-DD)',
  timeline_end: 'Coverage end (YYYY-MM-DD)',
  project_id: 'FK → crm_projects.id',
  // research
  entry_type: 'NOTE | CALCULATION | QUESTION | THESIS | RESEARCH',
  title: 'Entry title',
  calculator_type: 'Type of calculator (DCF, LBO, etc.) when entry_type=CALCULATION',
  output_summary: 'Plain-text summary of result',
  outputs_json: 'JSON of calculator outputs',
  inputs_json: 'JSON of calculator inputs',
  question_text: 'Original question text (entry_type=QUESTION)',
  visibility: 'PRIVATE | TEAM',
  tags: 'Array of tags (joined by ", ")',
  related_holding_id: 'FK to a holdings row',
  company_id: 'FK → crm_companies.id',
  // decisions
  decision_date: 'Date of decision (YYYY-MM-DD)',
  decision_type: 'BUY | SELL | TRIM | ADD | HOLD | REJECT',
  direction: 'LONG | SHORT | N/A',
  size_change: 'Numeric size delta',
  size_unit: 'shares | pct_nav | usd',
  confidence: 'Integer 1–5',
  rationale: 'Why the decision was made',
  key_assumptions: 'Critical assumptions',
  expected_outcome: 'Target outcome',
  catalyst_timeline: 'When the thesis should play out',
  risks_breaks_thesis: 'What would invalidate the thesis',
};

function describeColumn(col: string): string {
  return SCHEMA_DESCRIPTIONS[col] ?? '';
}

function buildSchemaBlock(name: string, cols: string[]): string {
  const lines = cols.map(c => `  - ${c}: ${describeColumn(c)}`.trimEnd());
  return `### ${name}\n${lines.join('\n')}`;
}

function sampleRow(rows: Record<string, unknown>[], cols: string[]): string {
  if (!rows.length) return '(no rows yet)';
  const r = rows[0];
  const obj: Record<string, unknown> = {};
  for (const c of cols) obj[c] = r[c] ?? null;
  return JSON.stringify(obj, null, 2);
}

export function buildCursorPrompt(payload: ExcelPayload): string {
  const { data, scope, exported_at } = payload;
  const counts = {
    transactions: data.transactions.length,
    valuations: data.valuations.length,
    companies: data.companies.length,
    research_entries: data.research_entries.length,
    decisions: data.decisions.length,
  };

  return `# SUFOX Capital — External Data Sink Specification

You are building an external data ingestion target for the SUFOX Capital
platform (an institutional Family Office / Hedge-Fund-style portfolio
management system). The user will paste tabular data (TSV/CSV/JSON) copied
from the source system into your interface, and you must store it with the
**exact** schema defined below.

## Source context
- Exported at: ${exported_at}
- Scope: ${scope.type}${scope.client_id ? ` (client_id=${scope.client_id})` : ' (personal)'}
- Row counts: transactions=${counts.transactions}, valuations=${counts.valuations}, companies=${counts.companies}, research=${counts.research_entries}, decisions=${counts.decisions}

## Hard requirements

1. Use these table/sheet names exactly: \`Transactions\`, \`Valuations\`,
   \`Analyses_Companies\`, \`Analyses_Research\`, \`Analyses_Decisions\`.
2. Use the column names below **exactly** (snake_case, lowercase). Do not
   rename, translate, or reorder columns when writing rows.
3. Preserve types:
   - Date-only fields → \`YYYY-MM-DD\`
   - Timestamp fields → ISO 8601 (\`YYYY-MM-DD HH:MM:SS\`)
   - Numeric fields → raw numbers (no thousands separators, no currency symbols)
   - Array fields (\`tags\`) → comma-separated strings on input, array on storage
   - JSON fields (\`inputs_json\`, \`outputs_json\`) → parse from string to JSON object
4. Ignore unknown columns gracefully but log them.
5. Use UUIDs for \`id\` columns; if missing, generate one server-side.
6. Build a clean web UI with: paste-area per sheet, preview table, validation
   errors panel, and a "Commit" button per sheet.

## Schemas

${buildSchemaBlock('Transactions', TRANSACTIONS_COLS)}

${buildSchemaBlock('Valuations', VALUATIONS_COLS)}

${buildSchemaBlock('Analyses_Companies', COMPANIES_COLS)}

${buildSchemaBlock('Analyses_Research', RESEARCH_COLS)}

${buildSchemaBlock('Analyses_Decisions', DECISIONS_COLS)}

## Real example rows (one per sheet, from the source system)

### Transactions sample
\`\`\`json
${sampleRow(data.transactions, TRANSACTIONS_COLS)}
\`\`\`

### Valuations sample
\`\`\`json
${sampleRow(data.valuations, VALUATIONS_COLS)}
\`\`\`

### Analyses_Companies sample
\`\`\`json
${sampleRow(data.companies, COMPANIES_COLS)}
\`\`\`

### Analyses_Research sample
\`\`\`json
${sampleRow(data.research_entries, RESEARCH_COLS)}
\`\`\`

### Analyses_Decisions sample
\`\`\`json
${sampleRow(data.decisions, DECISIONS_COLS)}
\`\`\`

## Stack guidance
- Use whatever stack the user prefers. If unspecified, use Next.js + a SQLite
  or Postgres database with the schemas above.
- Show row counts and the most recent commit per sheet on the dashboard.
- All input parsing must be strict on column names but lenient on whitespace
  and trailing empty rows.
`;
}
