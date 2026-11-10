import { ColumnFilterType, TableColumn, TableRow } from "../types";
import { FilterFnOption, SortingFnOption } from "@tanstack/react-table";

import { CellType } from "../Cells/types";
import { NUMERIC_CELL_TYPES } from "../config";

export const resolveIsTopic = (filterType: ColumnFilterType): boolean =>
    ["select", "multiselect", "pie"].includes(filterType);

export const resolveFilterType = (col: TableColumn): ColumnFilterType | undefined => {
    if (col.disableColumnFilter) return undefined;

    const cellType: CellType = col.type!;
    if (NUMERIC_CELL_TYPES.includes(cellType)) {
        return "histogram";
    }
    if (cellType === "boolean") {
        return "boolean";
    }

    return "select";
};

/* assign a sorting function based upon column type or user-specified sortingFn */
export const resolveSortingFn = (col: TableColumn): SortingFnOption<TableRow> => {
    if (col.sortingFn) {
        return col.sortingFn;
    }

    if (col.type === "boolean") {
        return "boolean";
    }
    if (col.type === "float") {
        return "scientific";
    }
    return "alphanumeric";
};

/* assing a filter function based on column type, user-specified filterType, 
or user-specified filterFn */
export const resolveFilterFn = (col: TableColumn): FilterFnOption<TableRow> => {
    if (col.filterOpts?.filterType === "multiselect") {
        return "includesAny"; // multiselect & text lists
    }

    if (col.filterOpts?.filterFn) {
        return col.filterOpts.filterFn;
    }

    if (col.type === "pvalue") {
        return "pvalue";
    }

    if (col.type === "float" || col.type === "integer") {
        return "inNumberRange"; // FIXME: not really implemented yet
    }

    if (col.type === "boolean") {
        return "equals";
    }

    // text field filtering; handles text lists, other grouping
    return "includesAny";
};
