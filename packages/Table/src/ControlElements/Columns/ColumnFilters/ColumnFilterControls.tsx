import { Button, FilterChip, FilterChipBar, InlineIcon, StylingProps } from "@niagads/ui";
import { Column, ColumnFilter, ColumnFiltersState } from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";

import { AGGEGRATE_TOPICS_COLUMN_ID } from "./filters/types";
import FilterComponent from "./filters/ColumnFilter";
import { TrashIcon } from "lucide-react";
import { fromNegLog10 } from "@niagads/common";
import styles from "./column-filter-controls.module.css";

interface ColumnFilterControlsProps {
    filterableColumns: Column<any, unknown>[];
    activeFilters: ColumnFiltersState;
    coreRowCount: number;
    onRemoveAll: () => void;
    onRemoveFilter: (filter: ColumnFilter) => void;
    filterGroupOrder?: string[];
}

export const ColumnFilterControls = ({
    filterableColumns,
    activeFilters,
    coreRowCount,
    onRemoveAll,
    onRemoveFilter,
    filterGroupOrder,
}: ColumnFilterControlsProps) => {
    const [showAtAGlanceFilters, setShowAtAGlanceFilters] = useState(true);
    const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);

    const { visualFilterColumns, additionalFilterColumns, topicFilterColumn } = useMemo(() => {
        const columns: {
            visualFilterColumns: Column<any, unknown>[];
            additionalFilterColumns: Column<any, unknown>[];
            topicFilterColumn?: Column<any, unknown>;
        } = {
            visualFilterColumns: [],
            additionalFilterColumns: [],
        };

        for (const col of filterableColumns) {
            const faceted = new Set(col.getAllValues()).size > 1;
            if (faceted) {
                // need to apply this logic here, in case visual filters yield no value added
                switch (col.columnDef.meta?.filterType) {
                    case "histogram":
                    case "pie":
                        columns.visualFilterColumns.push(col);
                        break;
                    case "multiselect":
                        if (col.columnDef.id === AGGEGRATE_TOPICS_COLUMN_ID) columns.topicFilterColumn = col;
                        else columns.additionalFilterColumns.push(col);
                        break;
                    default:
                        columns.additionalFilterColumns.push(col);
                }
            }
        }

        // Only histogram and pie columns reach this array;
        // false (0) sorts histograms before true (1) for pies.
        columns.visualFilterColumns.sort(
            (a, b) => Number(a.columnDef.meta?.filterType === "pie") - Number(b.columnDef.meta?.filterType === "pie")
        );

        return columns;
    }, [filterableColumns]);

    const columnFilterGroups = useMemo(
        () =>
            additionalFilterColumns.reduce(
                (groups, column) => {
                    const groupName = column.columnDef.meta?.filterGroup || "other";
                    const updated = groups[groupName] ? [...groups[groupName], column] : [column];

                    return {
                        ...groups,
                        [groupName]: updated,
                    };
                },
                {} as Record<string, Column<any, unknown>[]>
            ),
        [additionalFilterColumns]
    );

    const hasVisualFilters = visualFilterColumns.length > 0;
    const hasAdditionalFilters = additionalFilterColumns.length > 0;

    return (
        <div className={styles["filter-controls-container"]}>
            <FilterChipBar
                label={`Active Filters (${activeFilters.length})`}
                actions={
                    activeFilters.length > 0 ? (
                        <Button color="default" onClick={onRemoveAll}>
                            <InlineIcon icon={<TrashIcon size={16} />}>Clear all</InlineIcon>
                        </Button>
                    ) : undefined
                }
            >
                {activeFilters.length > 0 ? (
                    activeFilters.map((filter) => {
                        const col = filterableColumns.find((x) => x.id === filter.id);
                        let value: any =
                            col!.columnDef?.meta?.type === "pvalue"
                                ? `≤ ${fromNegLog10(filter.value as number)}`
                                : filter.value;
                        if (typeof value === "object") {
                            value = value.values;
                        } else {
                            value = `${value}`;
                        }

                        return (
                            <FilterChip
                                key={`filter-chip-${filter.id}`}
                                label={col!.columnDef.header as string}
                                value={value}
                                onRemove={() => onRemoveFilter(filter)}
                            />
                        );
                    })
                ) : (
                    <FilterChip label="None" disabled />
                )}
            </FilterChipBar>

            
              
                {(hasVisualFilters || topicFilterColumn) && (
                    <section className={styles["glance-section"]}>
                        <header className={styles["section-header"]}>
                            <span>At a Glance</span>

                            <SectionToggleButton
                                isExpanded={showAtAGlanceFilters}
                                expandedLabel="Collapse At a Glance filters"
                                collapsedLabel="Expand At a Glance filters"
                                onClick={() => setShowAtAGlanceFilters((value) => !value)}
                            />
                        </header>
                        {showAtAGlanceFilters && (
                           <> 
                            {hasVisualFilters && (
                                <div className={styles["visual-filter-grid"]}>
                                    {visualFilterColumns.map((column) => (
                                        <div className={styles["visual-filter-panel"]} key={`visual-filter-panel-${column.id}`}>
                                            <FilterComponent key={`visual-filter-${column.id}`} column={column} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {topicFilterColumn && (
                                <div className={styles["topic-filter-panel"]}>
                                    <FilterComponent key={`topic-filter`} column={topicFilterColumn} />
                                </div>
                            )}
                            </>
                        )}    
                    </section>
                )} 

            {hasAdditionalFilters && (
                <section className={styles["additional-filters-section"]}>
                    <header className={styles["section-header"]}>
                        <span>Additional Filters</span>

                        <SectionToggleButton
                            isExpanded={showAdditionalFilters}
                            expandedLabel="Collapse additional filters"
                            collapsedLabel="Expand additional filters"
                            onClick={() => setShowAdditionalFilters((value) => !value)}
                        />
                    </header>

                    {showAdditionalFilters && (
                        <div className={styles["additional-filter-grid"]}>
                            {filterGroupOrder
                                ? filterGroupOrder.map((groupName) => (
                                      <FilterGroup
                                          key={groupName}
                                          title={groupName}
                                          className={styles["additional-filter-panel"]}
                                          columns={columnFilterGroups[groupName]}
                                      />
                                  ))
                                : Object.keys(columnFilterGroups).map((groupName) => (
                                      <FilterGroup
                                          key={groupName}
                                          title={groupName}
                                          className={styles["additional-filter-panel"]}
                                          columns={columnFilterGroups[groupName]}
                                      />
                                  ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

interface SectionToggleButtonProps {
    isExpanded: boolean;
    expandedLabel: string;
    collapsedLabel: string;
    onClick: () => void;
}

const SectionToggleButton = ({ isExpanded, expandedLabel, collapsedLabel, onClick }: SectionToggleButtonProps) => (
    <button
        type="button"
        className={styles["section-toggle-button"]}
        onClick={onClick}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? expandedLabel : collapsedLabel}
    >
        <span className={styles["section-toggle-icon"]}>{isExpanded ? "−" : "+"}</span>
        <span>{isExpanded ? "Collapse" : "Expand"}</span>
    </button>
);

interface FilterGroupProps extends StylingProps {
    title: string;
    columns: Column<any, unknown>[];
}

const FilterGroup = ({ title, columns, className, style }: FilterGroupProps) => {
    const renderedFilters = useMemo(
        () =>
            columns.map((column) => (
                <FilterComponent key={`${column.columnDef.meta?.filterType}-filter-${column.id}`} column={column} />
            )),
        [columns]
    );

    const hasFilters = renderedFilters.length > 0;

    return hasFilters ? (
        <section className={className} style={style}>
            <header className={styles["additional-filter-panel-header"]}>{title}</header>
            <div className={styles["additional-filter-panel-body"]}>{renderedFilters}</div>
        </section>
    ) : null;
};
