import useSWR, { unstable_serialize } from "swr";
import type { DataSourceConfig, TableViewConfig } from "./types";
import type { TableData } from "../types";

function sourceKey(source: DataSourceConfig) {
    return source.type === "custom"
        ? ["niagads/table", "custom", source.cacheKey]
        : ["niagads/table", source.type, source.type === "file" ? source.path : source.url, source.select];
}

export function tableDataKey(config: TableViewConfig): string {
    return config.dataSource ? unstable_serialize(sourceKey(config.dataSource)) : "static";
}

async function loadRows(source: DataSourceConfig): Promise<TableData> {
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
    if (!Array.isArray(rows)) throw new Error("The table data source must return an array of records.");
    return rows as TableData;
}

/** Requests can outlive a panel so shared SWR consumers retain their cached results. */
export function useTableData(config: TableViewConfig, enabled = true) {
    const source = config.dataSource;
    const request = useSWR<TableData, Error>(
        source && enabled ? sourceKey(source) : null,
        source ? () => loadRows(source) : null,
        {
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
            void request.mutate().catch(() => undefined);
        },
    };
}

export type TableDataState = ReturnType<typeof useTableData>;
