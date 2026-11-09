import { AGGEGRATE_TOPICS_COLUMN_ID, FilterColumn, RowValueSummary } from "./types";
import { BooleanFilter, NoValidValueAlert } from ".";
import { FacetCountBadges, PillOption, PillSelect } from "@niagads/ui";
import { PieChart, PieChartDataRow } from "@niagads/charts";
import React, { ReactNode, useMemo, useState } from "react";

import { CategoryFilterValue } from "../filterFunctions";
import { DEFAULT_NA_VALUE } from "../../../../types";
import { FilterProps } from "./types";
import { RichSelect } from "@niagads/ui/client";
import { couldStartTrivia } from "typescript";
import styles from "./column-filter.module.css";

// FIXME: assignment of terms grouped in `Other` is being altered as counts change

// limits for categorical filters; excess aggregated into "Other"
// note for selects & pies max is actually value + 2 (n/a + Other)
const MAX_SELECT_OPTS = 7; // maximum unique opts for select / multiselect
const MAX_TOPICS = 15; // maximum number of terms (topics) for topic filter
const MAX_PIE_SLICES = 5; // maximum unique pie slices

export const TextColumnFilter = ({ column }: FilterColumn) => {
    const meta = column.columnDef.meta!;
    const naValue = meta.naValue || DEFAULT_NA_VALUE;

    // get "reference" unique values -> all possible values in pre-filtered data
    const valueCounts: Map<string, number> = useMemo(() => column.getUniqueValues(), [column.id]);
    const naCount = valueCounts.get(naValue) || 0;

    // return No Valid Values if every value in the unfiltered column is NA
    if (naCount && valueCounts.size === 1) {
        return <NoValidValueAlert columnName={column.columnDef.header!.toString()} />;
    }

    const categoryLimit =
        meta.filterType === "pie"
            ? MAX_PIE_SLICES
            : column.columnDef.id === AGGEGRATE_TOPICS_COLUMN_ID
              ? MAX_TOPICS
              : MAX_SELECT_OPTS;

    const ignoreOther = column.columnDef.id === AGGEGRATE_TOPICS_COLUMN_ID;

    // otherwise, sort and consolidate the value map
    const referenceValues = useMemo(() => {
        return _organizeValueCounts(valueCounts, naValue, categoryLimit, ignoreOther);
    }, [column.id]);

    // get faceted values and do the same
    const filteredValueCount = column.getFacetedUniqueValues();
    const filteredValues = useMemo(() => {
        return _organizeValueCounts(filteredValueCount, naValue, categoryLimit, ignoreOther);
    }, [Array.from(filteredValueCount.entries())]);

    const FilterProps = { column, referenceValues, filteredValues };

    if (meta.type === "boolean") {
        return <BooleanFilter {...FilterProps} />;
    }

    if (column.columnDef.id === AGGEGRATE_TOPICS_COLUMN_ID) {
        return (
            <MultiSelectPillFilter
                {...FilterProps}
                showMatchTypeControl={true}
                filterFieldLabel="Explore Topics"
                ignoreOther={true}
            />
        );
    }
    if (meta.filterType) {
        if (meta.filterType === "pie") {
            return <PieChartFilter {...FilterProps} />;
        }

        if (meta.filterType === "multiselect") {
            return <MultiSelectPillFilter {...FilterProps} />;
        }
    }

    return <RichSelectFilter {...FilterProps} />;
};

export const PieChartFilter = ({ column, referenceValues, filteredValues }: FilterProps) => {
    const referenceChartData: PieChartDataRow[] = useMemo(
        () =>
            Object.entries(referenceValues.counts).map(([key, count]) => ({
                id: key,
                value: count,
            })),
        [column.id]
    );

    // need to build same object for filtered data (inner pie), but
    // ensure that the order of the fields is the same
    const filteredChartData: PieChartDataRow[] = useMemo(() => {
        const referenceOrder = Object.keys(referenceValues.counts);
        return Object.entries(filteredValues.counts)
            .sort(([keyA], [keyB]) => {
                const indexA = referenceOrder.indexOf(keyA);
                const indexB = referenceOrder.indexOf(keyB);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return 0;
            })
            .map(([key, count]) => ({
                id: key,
                value: count,
            }));
    }, [column.id, filteredValues.counts]);

    return (
        <PieChart
            title={column.columnDef.header!.toString()}
            data={filteredChartData}
            referenceData={referenceChartData}
            visualizationInfo={{
                compactDisplay: true,
                description:
                    "The inner pie shows counts remaining after current filters; the outer ring shows reference counts.",
                encodings: [
                    {
                        label: "Slice size",
                        description: "The angle and area of each slice represent the record count for that value.",
                    },
                    {
                        label: "Color",
                        description: "Each color identifies a value, as shown in the legend.",
                    },
                    {
                        label: "Rings",
                        description:
                            "The inner pie shows counts after applying all filters, while the outer ring shows total record counts.",
                    },
                ],
                interactions: ["Select a slice to filter the table by that value."],
            }}
            legendPosition="right"
            maxChartWidth={200}
            compactLegend
            onClick={(v: string) =>
                column.setFilterValue((v && { values: [v], otherValues: referenceValues.otherValues }) || undefined)
            }
            displayOpts={{ width: "100%" }}
            preserveSliceOrder={true}
        />
    );
};

export const RichSelectFilter = ({ column, referenceValues, filteredValues }: FilterProps) => {
    const opts = useMemo(() => {
        return Object.entries(referenceValues.counts).reduce(
            (acc, [value, count]) => {
                acc[value] = (
                    <FacetCountBadges
                        style={{ fontSize: "0.75rem" }}
                        count={filteredValues.counts[value] || 0}
                        total={count}
                        variant="pill"
                    />
                );
                return acc;
            },
            {} as Record<string, ReactNode>
        );
    }, [referenceValues.counts, filteredValues.counts]);

    const disabledOptions = useMemo(
        () => Object.keys(referenceValues.counts).filter((value) => (filteredValues.counts[value] ?? 0) === 0),
        [referenceValues.counts, filteredValues.counts]
    );

    const currentFilterValue = column.getFilterValue() as CategoryFilterValue;

    return (
        <RichSelect
            label={column.columnDef.header!.toString()}
            placeholder="Select ..."
            options={opts}
            disabledOptions={disabledOptions}
            onChange={(v) => {
                column.setFilterValue((v && { values: [v], otherValues: referenceValues.otherValues }) || undefined);
            }}
            value={currentFilterValue?.values[0]}
        />
    );
};

export const MultiSelectPillFilter = ({
    column,
    referenceValues,
    filteredValues,
    showMatchTypeControl = false,
    filterFieldLabel,
    ignoreOther = false,
}: FilterProps & { showMatchTypeControl?: boolean; filterFieldLabel?: string; ignoreOther?: boolean }) => {
    /* To clarify "fitlered counts" here.  `filteredValues` are calculated from tanstack `facetedRowModel`. 
     This reflects current table state for all but the requesting column.  For `counts` to update in the display
     when we select a pill, we need to get counts based on current state of the current column from the
     `filteredRowModel`.  Hence call to `getFilteredUniqueValues` and saving organized counts to `internalFilterValues.
     `counts` are updated from here.  But `disabled` state is based on the faceted filter model (`filteredValues`)
     so that buttons are only disabled if an external column removes that option.  Internally, its a multiselect so even
     if choosing one button reduces to zero choices, can add them back in.
    */
    const naValue = column.columnDef?.meta?.naValue || DEFAULT_NA_VALUE;
    const internalFilterValues = _organizeValueCounts(
        column.getFilteredUniqueValues(),
        naValue,
        MAX_SELECT_OPTS,
        ignoreOther
    );

    const opts: PillOption[] = useMemo(
        () =>
            Object.entries(referenceValues.counts).map(([value, total]) => {
                const count = internalFilterValues.counts[value] ?? 0;
                return { value, count, total, disabled: (filteredValues.counts[value] ?? 0) === 0 };
            }),
        [referenceValues.counts, filteredValues.counts, internalFilterValues.counts]
    );

    // necessary b/c filteredValues is table state after filtering which does not reflect selection state
    const activeFilters = column.getFilterValue() as CategoryFilterValue;
    let selectedValues = (activeFilters && activeFilters.values) || [];

    const label = filterFieldLabel || column.columnDef.header!.toString();
    return (
        <div className={styles["filter-pill-select-container"]}>
            {showMatchTypeControl && (
                <div className={styles["filter-topic-header"]}>
                    {label && <div className={styles["filter-field-label"]}>{label}</div>}

                    <div className={styles["filter-topic-match-mode"]} aria-label="match mode">
                        <button
                            type="button"
                            className={[
                                styles["filter-topic-match-mode-button"],
                                styles["filter-topic-match-mode-button-selected"],
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-pressed={true}
                        >
                            Match all
                        </button>
                        <button type="button" className={styles["filter-topic-match-mode-button"]} aria-pressed={false}>
                            Match any
                        </button>
                    </div>
                </div>
            )}

            <PillSelect
                label={showMatchTypeControl ? undefined : label}
                options={opts}
                selectedValues={selectedValues}
                variant="faceted-counts"
                onChange={(v) =>
                    column.setFilterValue((v && { values: v, otherValues: referenceValues.otherValues }) || undefined)
                }
            ></PillSelect>
        </div>
    );
};

/**
 * Sorts and organizes unique values for filter display, handling overflow by grouping into "Other"
 *
 * @param naValue - The N/A value representation
 * @param valueCounts - Map of unique values and their counts
 * @param limit - max number of unique values before aggregating remainder into "Other"
 * @param ignoreOther - drop Other
 * @returns Object with sorted value/count map and list of values grouped as "Other"
 */
const _organizeValueCounts = (
    valueCounts: Map<string, number>,
    naValue: string,
    limit: number,
    ignoreOther: boolean = false
): RowValueSummary => {
    let filteredValueCounts: Record<string, number> = {};
    let otherValues: string[] = [];

    // consolidate values if there are too many into "Other"
    if (valueCounts.size > limit) {
        // sort by most frequent to least frequent values; filtering for n/as
        const sortedEntries = [...valueCounts.entries()]
            .filter(([value]) => value !== naValue)
            .sort((a, b) => b[1] - a[1]);

        const topEntries = sortedEntries.slice(0, limit);
        const otherEntries = sortedEntries.slice(limit).reduce(
            (acc, [value, count]) => ({
                values: [...acc.values, value],
                count: acc.count + count,
            }),
            { values: [] as string[], count: 0 }
        );

        filteredValueCounts = Object.fromEntries(topEntries);
        if (otherEntries.count > 0 && !ignoreOther) {
            filteredValueCounts.Other = otherEntries.count;
            otherValues = otherEntries.values;
        }
    } else {
        const sortedEntries = [...valueCounts.entries()]
            .filter(([value]) => value !== naValue)
            .sort((a, b) => b[1] - a[1]);

        filteredValueCounts = Object.fromEntries(sortedEntries);
    }

    // add NAs back in if relevant
    const naCount = valueCounts.get(naValue) || 0;
    if (naCount > 0) {
        filteredValueCounts[naValue] = naCount;
    }

    return { counts: filteredValueCounts, otherValues: otherValues };
};
