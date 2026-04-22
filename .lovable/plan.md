
Add a new Data Export section to Settings that generates a precise JSON export containing only the user’s own data for the active context, limited to Analyses, Value Data, and Transactions.

1. Update the Settings page UI
- Modify `src/pages/Settings.tsx`.
- Add a new card under the existing “Data Management” area titled “Data Export”.
- Include:
  - short explanation of what is exported
  - explicit scope text: “Active context only”
  - one primary button: “Export JSON”
  - loading state while assembling export
  - success/error toast handling
- Keep the style consistent with the existing Settings cards and controls.

2. Build a deterministic export payload in the client
- In `src/pages/Settings.tsx`, add an export handler that fetches fresh records directly from the backend instead of relying on derived UI state.
- Use the authenticated user id plus the active session context from `SessionContext`:
  - personal context: `client_id IS NULL`
  - client context: `client_id = active client id`
- Fetch only these categories:
  - `crm_companies` as Analysis company records
  - `company_research_entries` as linked analysis/research records
  - `valuations` as Value Data
  - `transactions` as Transactions
- Apply exact filtering rules:
  - `crm_companies`: user-owned, not soft-deleted, current context only
  - `valuations`: user-owned, not soft-deleted, current context only
  - `transactions`: user-owned, not soft-deleted, current context only
  - `company_research_entries`: user-owned, and limited to analysis records relevant to the exported scope by linking through the exported company ids and/or matching exported tickers
- Sort each collection deterministically before serialization:
  - transactions: `date`, then `created_at`, then `id`
  - valuations: `month`, then `created_at`, then `id`
  - analyses companies: `created_at`, then `id`
  - research entries: `created_at`, then `id`

3. Preserve exact stored fields and relationships
- Export raw database rows for those categories so nothing user-entered is lost or transformed.
- Do not remap into reduced frontend-only shapes.
- Preserve ids and linking fields exactly as stored, including:
  - `company_id`
  - `linked_company_id`
  - `ticker`
  - `client_id`
  - timestamps
  - JSON fields such as `inputs_json` / `outputs_json`
- Wrap the data in a minimal top-level structure for reliable migration, for example:
```text
{
  "export_version": 1,
  "exported_at": "...",
  "scope": {
    "type": "personal" | "client",
    "client_id": null | "..."
  },
  "data": {
    "analyses": {
      "companies": [...],
      "research_entries": [...]
    },
    "value_data": [...],
    "transactions": [...]
  }
}
```
- Keep this envelope minimal and migration-safe; do not include UI state, settings, logs, caches, sample data, or computed metrics.

4. Generate the downloadable file
- Serialize with `JSON.stringify(payload, null, 2)` for stable formatting.
- Download as `sufox_data_export.json`.
- Revoke the object URL after download to avoid leaks.

5. Precision and safety rules during implementation
- Ensure export always uses real stored records from the backend, not placeholder arrays or sample mode data.
- Disable export or show a clear error if the user is not authenticated or no context is set.
- Never include unrelated tables such as notifications, settings, audit/activity logs, files, market data, system configs, or auth/profile records.
- Do not add any database changes; existing RLS policies already allow reading the required owned records.

6. Files to modify
- `src/pages/Settings.tsx`

7. Notes for implementation validation
- Verify the exported JSON contains only:
  - analyses companies
  - analysis research entries
  - valuations
  - transactions
- Verify that deleted records are excluded where soft delete exists.
- Verify active-context filtering by checking both personal and client modes.
- Verify relationship integrity:
  - research entries reference exported analyses
  - transactions / valuations retain their company links and ids unchanged
- Confirm the final file name is exactly `sufox_data_export.json`.

8. Expected deliverable summary after implementation
- List modified files
- Confirm no placeholder values remain
- Confirm only the requested categories are exported
- Provide the exact top-level JSON structure used for reproducible migration
