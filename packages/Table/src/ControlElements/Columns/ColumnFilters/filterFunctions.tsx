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

export type CategoryFilterValue = {
    values: string[]; // values on which to filter
    otherValues: string[]; // substitution for other
};

// for handling multi-selects, accounting for list text fields
// and anything that might have "Other", so basically, all text fields
export const includesAnyFilter: FilterFn<any> = (row, columnId, filterValue: CategoryFilterValue) => {
    let filterValues = filterValue.values;
    if (filterValues.length === 0) return true;

    const rvalue = row.getValue(columnId) as string;
    const rowValues = rvalue.includes("//") ? rvalue.split(" // ") : [rvalue];

    if (filterValues.includes("Other")) {
        filterValues = filterValues.filter((v) => v !== "Other");
        filterValues = [...filterValues, ...filterValue.otherValues];
    }

    return filterValues.some((val) => rowValues.includes(val));
};

/* for handling user choice of `all` v `any` matches for the topics filter */
export type TopicFilterValue = {
    values: string[];
    mode: "any" | "all";
};

export const topicFilter: FilterFn<any> = (row, columnId, filterValue: TopicFilterValue) => {
    if (!filterValue.values || (filterValue && filterValue.values.length === 0)) return true;
    const topics = (row.getValue(columnId) as string).split(" // ");

    return filterValue.mode === "all"
        ? filterValue.values.every((value) => topics.includes(value))
        : filterValue.values.some((value) => topics.includes(value));
};
