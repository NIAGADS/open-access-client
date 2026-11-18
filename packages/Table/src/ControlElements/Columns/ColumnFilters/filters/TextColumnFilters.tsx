import { AGGEGRATE_TOPICS_COLUMN_ID, FilterColumn, RowValueSummary } from "./types";
import { DEFAULT_NA_VALUE, MAX_PIE_SLICES, MAX_SELECT_OPTS, MAX_TOPICS } from "../../../../config";
import { PieChart, PieChartDataRow } from "@niagads/charts";
import { PillOption, PillSelect } from "@niagads/ui/client";
import React, { ReactNode, useMemo, useState } from "react";

import { BooleanFilter } from "./BooleanColumnFilter";
import { CategoryFilterValue } from "../filterFunctions";
import { Column } from "@tanstack/react-table";
import { FacetCountBadges } from "@niagads/ui";
import { FilterProps } from "./types";
import { NoValidValueAlert } from "./NoValidValueAlert";
import { RichSelect } from "@niagads/ui/client";
import styles from "./column-filter.module.css";

export const TextColumnFilter = ({ column }: FilterColumn) => {
    const meta = column.columnDef.meta!;
    const naValue = meta.naValue || DEFAULT_NA_VALUE;
    const isTopicFilter = column.columnDef.id === AGGEGRATE_TOPICS_COLUMN_ID;

    // get "reference" unique values -> all possible values in pre-filtered data
    const valueCounts: Map<string, number> = useMemo(() => column.getUniqueValues(), [column.id]);
    const naCount = valueCounts.get(naValue) || 0;

    // return No Valid Values if every value in the unfiltered column is NA
    if (naCount && valueCounts.size === 1) {
        return <NoValidValueAlert columnName={column.columnDef.header!.toString()} />;
    }

    const categoryLimit = meta.filterType === "pie" ? MAX_PIE_SLICES : isTopicFilter ? MAX_TOPICS : MAX_SELECT_OPTS;
    const totalRows = column.getFacetedRowModel().rows.length;
    // otherwise, sort and consolidate the value map
    const referenceValues = useMemo(() => {
        if (isTopicFilter) {
            // filter out redundant topics
            const effectiveValueCounts = new Map([...valueCounts].filter(([, count]) => count !== totalRows));
            return _organizeValueCounts(effectiveValueCounts, naValue, categoryLimit, true);
        }

        return _organizeValueCounts(valueCounts, naValue, categoryLimit);
    }, [column.id]);

    // get faceted values and do the same
    const filteredValueCount = column.getFacetedUniqueValues();
    const filteredValues = useMemo(() => {
        if (isTopicFilter) {
        }
        return _organizeValueCounts(
            filteredValueCount,
            naValue,
            categoryLimit,
            isTopicFilter,
            referenceValues.otherValues
        );
    }, [Array.from(filteredValueCount.entries())]);

    const FilterProps = { column, referenceValues, filteredValues };

    if (meta.type === "boolean") {
        return <BooleanFilter {...FilterProps} />;
    }

    if (isTopicFilter) {
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

    const currentFilterValue = column.getFilterValue() as CategoryFilterValue;

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
            selectedSlice={currentFilterValue?.values[0]}
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

const _getActiveFilters = (column: Column<any, unknown>, otherValues: string[]) => {
    const values = (column.getFilterValue() as CategoryFilterValue)?.values || [];
    const activeFilters = values.filter((value) => !otherValues.includes(value));
    return values.length > activeFilters.length ? [...activeFilters, "Other"] : activeFilters;
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
    const [matchMode, setMatchMode] = useState<string>("any");

    const naValue = column.columnDef?.meta?.naValue || DEFAULT_NA_VALUE;
    const internalFilterValues = _organizeValueCounts(
        column.getFilteredUniqueValues(),
        naValue,
        MAX_SELECT_OPTS,
        ignoreOther,
        referenceValues.otherValues
    );

    const selectedValues = _getActiveFilters(column, referenceValues.otherValues);
    const opts: PillOption[] = Object.entries(referenceValues.counts).map(([value, total]) => {
        const count = internalFilterValues.counts[value] ?? 0;
        const isSelected = selectedValues.includes(value);
        const unavailableUnderOtherFilters = (filteredValues.counts[value] ?? 0) === 0;
        const unavailableForMatchAll = matchMode === "all" && count === 0;
        return {
            value,
            count,
            total,
            disabled: !isSelected && (unavailableUnderOtherFilters || unavailableForMatchAll),
        };
    });

    const handleMatchModeChange = (mode: "any" | "all") => {
        setMatchMode(mode);

        // rerun filter with new mode
        selectedValues.length > 0 &&
            column.setFilterValue({
                values: selectedValues,
                otherValues: referenceValues.otherValues,
                mode: mode,
            });
    };

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
                                matchMode === "all" && styles["filter-topic-match-mode-button-selected"],
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-pressed={matchMode === "all"}
                            onClick={() => handleMatchModeChange("all")}
                        >
                            Match all
                        </button>
                        <button
                            type="button"
                            className={[
                                styles["filter-topic-match-mode-button"],
                                matchMode === "any" && styles["filter-topic-match-mode-button-selected"],
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-pressed={matchMode === "any"}
                            onClick={() => handleMatchModeChange("any")}
                        >
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
                    column.setFilterValue(
                        (v &&
                            v.length > 0 && { values: v, otherValues: referenceValues.otherValues, mode: matchMode }) ||
                            undefined
                    )
                }
            ></PillSelect>
        </div>
    );
};

/**
 * Sorts and organizes unique values for filter display, handling overflow by grouping into "Other"
 *
 * @param naValue - The N/A value representation
 * @param facetedValues - Map of unique values and their counts
 * @param limit - max number of unique values before aggregating remainder into "Other"
 * @param ignoreOther - drop Other
 * @param referenceOtherValues - list of 'other values' used to preserve reference defined 'Other' after filtering
 * @returns Object with sorted value/count map and list of values grouped as "Other"
 */
const _organizeValueCounts = (
    facetedValues: Map<string, number>,
    naValue: string,
    limit: number,
    ignoreOther: boolean = false,
    referenceOtherValues: string[] | undefined = undefined
): RowValueSummary => {
    let topFacetedValues: Record<string, number> = {};
    let otherValues: string[] = [];

    // sort by most frequent to least frequent values; filtering for n/as
    const sortedEntries = [...facetedValues.entries()]
        .filter(([value]) => value !== naValue)
        .sort((a, b) => b[1] - a[1]);

    if (referenceOtherValues) {
        // don't rank and recalc `Other`; just remove "Others" & count them based on reference
        const topEntries = sortedEntries.filter(([value]) => !referenceOtherValues.includes(value));
        topFacetedValues = Object.fromEntries(topEntries);
        const otherCount = sortedEntries.reduce(
            (total, [value, count]) => total + (referenceOtherValues.includes(value) ? count : 0),
            0
        );

        if (otherCount > 0 && !ignoreOther) {
            topFacetedValues.Other = otherCount;
            otherValues = referenceOtherValues;
        }
    } else {
        // consolidate values if there are too many into "Other"
        if (facetedValues.size > limit) {
            const topEntries = sortedEntries.slice(0, limit);
            const otherEntries = sortedEntries.slice(limit).reduce(
                (acc, [value, count]) => ({
                    values: [...acc.values, value],
                    count: acc.count + count,
                }),
                { values: [] as string[], count: 0 }
            );

            topFacetedValues = Object.fromEntries(topEntries);
            if (otherEntries.count > 0 && !ignoreOther) {
                topFacetedValues.Other = otherEntries.count;
                otherValues = otherEntries.values;
            }
        } else {
            topFacetedValues = Object.fromEntries(sortedEntries);
        }
    }

    if (!ignoreOther) {
        // add NAs back in if relevant
        const naCount = facetedValues.get(naValue) || 0;
        if (naCount > 0) {
            topFacetedValues[naValue] = naCount;
        }
    }

    return { counts: topFacetedValues, otherValues: otherValues };
};
