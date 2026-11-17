import type { TableProps } from "../Table";
import type { TableData } from "../types";

/** Adapt an API response to TableData; keep this object stable between renders. */
export interface DataSourceConfig {
    load: (signal: AbortSignal) => Promise<TableData>;
}

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
}

export interface TabbedTableViewProps {
    config: TabbedTableConfig;
    selectedTab?: string;
    onTabChange?: (tabId: string) => void;
    /** Accessible name shared by the tab list and compact selector. */
    label?: string;
}
