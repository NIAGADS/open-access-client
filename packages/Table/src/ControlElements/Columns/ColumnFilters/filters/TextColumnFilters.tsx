import { Badge, FacetCountBadges } from "@niagads/ui";
import { PieChart, PieChartDataRow } from "@niagads/charts";
import React, { ReactNode, useCallback, useMemo } from "react";

import { Column } from "@tanstack/react-table";
import { FilterProps } from "./types";
import { RichSelect } from "@niagads/ui/client";
import styles from "./column-filter.module.css";

const _resolveTextFilterValue = (value: string | undefined, otherValues: string[]) => {
    if (value === undefined || value === "") {
        return undefined;
    }

    if (value === "Other") {
        return otherValues;
    }

    return [value];
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
            onClick={(v: string) => column.setFilterValue(_resolveTextFilterValue(v, referenceValues.otherValues))}
            displayOpts={{ width: 200 }}
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
                    />
                );
                return acc;
            },
            {} as Record<string, ReactNode>
        );
    }, [filteredValues]);

    const disabledOptions = useMemo(
        () => Object.keys(referenceValues.counts).filter((value) => (filteredValues.counts[value] ?? 0) === 0),
        [filteredValues]
    );

    return (
        <RichSelect
            label={column.columnDef.header!.toString()}
            placeholder="Select ..."
            options={opts}
            disabledOptions={disabledOptions}
            onChange={(v) => column.setFilterValue(_resolveTextFilterValue(v, referenceValues.otherValues))}
        />
    );
};

export const MultiSelectPillFilter = ({ column, referenceValues, filteredValues, showLabel = true }: FilterProps) => {
    const otherValues = useMemo(() => referenceValues.otherValues, [column.id]);
    const resolveFilterValue = useCallback(
        (newFilterValues: string[]) => {
            if (newFilterValues.length > 0) {
                if (newFilterValues.includes("Other")) {
                    const adjustedFilterValues = newFilterValues.filter((v) => v !== "Other");
                    return [...adjustedFilterValues, ...otherValues];
                }

                return newFilterValues;
            }

            return undefined;
        },
        [column.id]
    );

    const opts = useMemo(() => {
        return Object.entries(filteredValues.counts).reduce(
            (acc, [value, count]) => {
                acc[value] = count;
                return acc;
            },
            {} as Record<string, number>
        );
    }, [filteredValues]);

    // determine which options are currently "selected/checked"
    const optionKeys = Object.keys(opts);
    const filterValues = (column.getFilterValue() as string[]) || [];
    const filterValuesIncludeOther = filterValues.some((item) => otherValues.includes(item));

    let selectedValues = filterValues.filter((item) => !otherValues.includes(item)) || [];
    if (filterValuesIncludeOther) {
        selectedValues.push("Other");
    }

    const label = column.columnDef.header!.toString();

    return (
        <div className={styles["filter-pill-container"]}>
            {showLabel && <div className={styles["filter-field-label"]}>{label}</div>}

            <div className={styles["filter-pill-grid"]}>
                {optionKeys.map((optionKey) => {
                    const isSelected = selectedValues.includes(optionKey);
                    const newValues = isSelected
                        ? selectedValues.filter((v) => v !== optionKey)
                        : [...selectedValues, optionKey];

                    return (
                        <button
                            key={optionKey}
                            type="button"
                            className={[styles["filter-pill"], isSelected && styles["filter-pill-selected"]]
                                .filter(Boolean)
                                .join(" ")}
                            aria-pressed={isSelected}
                            onClick={() => column.setFilterValue(resolveFilterValue(newValues))}
                        >
                            <span className={styles["filter-pill-icon"]}>{isSelected ? "✓" : "+"}</span>
                            <span className={styles["filter-pill-label"]}>{optionKey}</span>
                            <span className={styles["filter-pill-count"]}>{opts[optionKey]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// topic filters may combine values across multiple columns
export interface TopicFilterProps extends Omit<FilterProps, "column"> {
    columns: Column<any, unknown>[];
}
