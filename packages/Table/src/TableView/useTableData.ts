import useSWR, { unstable_serialize } from "swr";
import type { DataSourceConfig, TableViewConfig } from "./types";
import type { TableData } from "../types";

// Cache by the requested data, not the tab ID, so separate views can share one request.
// Include the selector: the same URL can produce different row arrays after adaptation.
function sourceKey(source: DataSourceConfig) {
    return source.type === "custom"
        ? ["niagads/table", "custom", source.cacheKey]
        : ["niagads/table", source.type, source.type === "file" ? source.path : source.url, source.select];
}

// This is only an identity tag for header counts, not a second data cache.
// Reuse SWR's serialization so replacing a source also invalidates its old count.
export function tableDataKey(config: TableViewConfig): string {
    return config.dataSource ? unstable_serialize(sourceKey(config.dataSource)) : "static";
}

async function loadRows(source: DataSourceConfig): Promise<TableData> {
    // A request belongs to SWR's shared cache, not a panel's lifetime. Do not abort it
    // on panel unmount: another subscriber may still need the result.
    const controller = new AbortController();
    let rows: unknown;
    if (source.type === "custom") {
        rows = await source.load(controller.signal);
    } else {
        const response = await fetch(source.type === "file" ? source.path : source.url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Unable to load table data (HTTP ${response.status}).`);
        const json: unknown = await response.json();
        rows = source.select ? source.select(json) : json;
    }
    // Normalize every source before passing it to Table; wrapped responses need select.
    if (!Array.isArray(rows)) throw new Error("The table data source must return an array of records.");
    return rows as TableData;
}

/**
 * Share source resolution and SWR state between standalone and tabbed views.
 * Subscribing here does not mount Table or its filters; SWR owns the data cache.
 */
export function useTableData(config: TableViewConfig, enabled = true) {
    const source = config.dataSource;
    const request = useSWR<TableData, Error>(
        // A null key disables the request for static data or an unvisited onSelect tab.
        source && enabled ? sourceKey(source) : null,
        source ? () => loadRows(source) : null,
        {
            // Keep table contents stable during review; retries are explicitly user-driven.
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            revalidateIfStale: false,
            shouldRetryOnError: false,
        }
    );
    return {
        data: source ? request.data : config.data,
        loading: !!source && enabled && request.isLoading,
        error: source ? request.error : undefined,
        retry: () => {
            // SWR exposes a failed retry through request.error; avoid an unhandled promise
            // rejection from the button handler while keeping the error visible in the UI.
            void request.mutate().catch(() => undefined);
        },
    };
}

export type TableDataState = ReturnType<typeof useTableData>;
