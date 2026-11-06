import { Range, toNegLog10 } from "@niagads/common";
import { rankItem, rankings } from "@tanstack/match-sorter-utils";

import { FilterFn } from "@tanstack/react-table";

// fuzzy filter for global text search, allow typos, _ delimited words, etc.
export const globalFuzzyFilter: FilterFn<any> = (row, columnId, filterValue: string) => {
    // Rank the item and determine ranking type, pass contains
    const itemRank = rankItem(row.getValue(columnId), filterValue);
    return itemRank.rank >= rankings.CONTAINS;
};

export const neglog10Filter: FilterFn<any> = (row, columnId, filterValue) => {
    const rowValue = row.getValue(columnId) as number;
    const targetValue: number | undefined = filterValue;

    if (targetValue === undefined) return true;

    return toNegLog10(rowValue) >= targetValue;
};

// for handling multi-selects, accounting for list text fields
// and anything that might have "Other", so basically, all text fields

export type CategoryFilterValue = {
    values: string[]; // values on which to filter
    otherValues?: string[]; // substitution for `Other` in values; optional for Topics Filter
    mode?: "any" | "all"; // optional for Topics Filter
};

export const includesAnyOrAllFilter: FilterFn<any> = (row, columnId, filterValue: CategoryFilterValue) => {
    if (filterValue && !filterValue.mode) {
        filterValue.mode = "any"; // default is match any
    }
    // No-op callback required by FilterFn's TypeScript signature which expects
    // an additional `addMeta` field
    if (filterValue.mode === "any") {
        return includesAnyFilter(row, columnId, filterValue, () => {});
    } else return includesAllFilter(row, columnId, filterValue, () => {});
};

export const includesAnyFilter: FilterFn<any> = (row, columnId, filterValue: CategoryFilterValue) => {
    let filterValues = filterValue.values;
    if (filterValues.length === 0) return true;

    const rowValues = (row.getValue(columnId) as string).split(" // ");

    if (filterValue.otherValues && filterValues.includes("Other")) {
        filterValues = filterValues.filter((v) => v !== "Other");
        filterValues = [...filterValues, ...filterValue.otherValues];
    }

    return filterValue.values.some((value) => rowValues.includes(value));
};

export const includesAllFilter: FilterFn<any> = (row, columnId, filterValue: CategoryFilterValue) => {
    let filterValues = filterValue.values;
    if (filterValues.length === 0) return true;

    const rowValues = (row.getValue(columnId) as string).split(" // ");

    if (filterValue.otherValues && filterValues.includes("Other")) {
        filterValues = filterValues.filter((v) => v !== "Other");
        filterValues = [...filterValues, ...filterValue.otherValues];
    }

    return filterValue.values.every((value) => rowValues.includes(value));
};
