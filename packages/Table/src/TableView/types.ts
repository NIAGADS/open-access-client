import type { TableProps } from "../Table";
import type { TableData } from "../types";

type JsonDataSource = {
    /** Extract rows when the JSON response is not already a TableData array. */
    select?: (response: unknown) => TableData;
} & ({ type: "file"; path: string } | { type: "endpoint"; url: string });

export type DataSourceConfig =
    | JsonDataSource
    | {
          type: "custom";
          /** A stable, unique SWR cache key for this request, including any parameters. */
          cacheKey: string;
          load: (signal: AbortSignal) => Promise<TableData>;
      };

export type TableViewConfig = Omit<TableProps, "data"> & {
    title: string;
    description?: string;
} & ({ data: TableData; dataSource?: never } | { data?: never; dataSource: DataSourceConfig });

export interface TableViewProps {
    config: TableViewConfig;
}

export interface TableTabConfig {
    id: string;
    label: string;
    count?: number;
    table: TableViewConfig;
}

export interface TabbedTableConfig {
    tabs: TableTabConfig[];
    defaultTab?: string;
    /** Fetch all sources immediately by default; onSelect defers each until first selection. */
    fetchPolicy?: "background" | "onSelect";
}

export interface TabbedTableViewProps {
    config: TabbedTableConfig;
    selectedTab?: string;
    onTabChange?: (tabId: string) => void;
    /** Accessible name shared by the tab list and compact selector. */
    label?: string;
}
