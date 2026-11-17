# Table views

`TableView` wraps the existing table with an independent title, description and optional data loading. `TabbedTableView` adds connected folder tabs around the entire view. Both are exported from `@niagads/table`.

```tsx
import { TableView, TabbedTableView, type TabbedTableConfig } from "@niagads/table";

const config: TabbedTableConfig = {
    defaultTab: "authored",
    tabs: [
        {
            id: "authored",
            label: "NIAGADS Authored",
            count: 23, // optional known count; inactive tabs are not fetched for counts
            table: {
                ...authoredTableConfig, // existing TableConfig, including data/columns/options
                title: "NIAGADS Authored Publications",
                description: "Publications by NIAGADS investigators.",
            },
        },
        {
            id: "enabled",
            label: "Research Enabled",
            table: enabledTableViewConfig,
        },
    ],
};

<TableView config={config.tabs[0].table} />;
<TabbedTableView config={config} />;
```

Each view accepts either existing `data` or a `dataSource`, never both. A loader owns endpoint selection, authentication and response adaptation. Return data in the same shape accepted by `TableConfig["data"]`. Check HTTP status before returning records; rejected requests display an error and Retry.

```tsx
const enabledTableViewConfig = {
    id: "enabled-publications",
    title: "Research Enabled by NIAGADS",
    columns: publicationColumns,
    options: publicationOptions,
    dataSource: {
        load: async (signal: AbortSignal) => {
            const response = await fetch("/api/publications?subset=enabled", { signal });
            if (!response.ok) throw new Error("Unable to retrieve enabled publications.");
            return adaptPublications(await response.json());
        },
    },
};
```

Keep data-source objects stable (module-level configuration or `useMemo`). Replacing a source aborts its pending request and reloads it; late responses are ignored. A failed request retries only when Retry is selected. Empty results display “No records found.”

Only the initial tab mounts immediately. Other views mount on first selection and remain mounted while hidden, retaining loaded data, filters, sorting, pagination and column visibility. Memory grows with visited tables. State is scoped to the mounted wrapper, not persisted across page reloads. Removing a tab or changing its ID discards its view. Give table configs distinct `id` values as for existing standalone tables.

Use `selectedTab` and `onTabChange` for externally controlled selection, including URL-backed navigation. The caller reads/writes the URL and handles back/forward changes; no browser history is changed by this package. `defaultTab` is only the initial uncontrolled selection. Empty tab lists, duplicate/blank IDs and unknown configured selections throw an actionable error.

Tabs use standard arrow, Home and End keys with automatic activation. At container widths of 40rem or less, a labeled native dropdown replaces the tab strip without replacing the views. Optional `label` names both navigation controls (default: “Tables”).

Storybook: **Table / TabbedTableView** covers connected folders, retained state, lazy sources, controlled selection and constrained width; **Table / TableView** covers standalone, loading, empty and retry states. Stories reuse existing example tables and local loaders; no live service or application is required.
