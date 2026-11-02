import { Badge, Checkbox, FacetCountBadges } from "@niagads/ui";
import { FilterProps, RowValueSummary } from "./types";

import React from "react";
import styles from "./column-filter.module.css";

export const BooleanFilter = ({ column, referenceValues, filteredValues }: FilterProps) => {
    const meta = column.columnDef.meta!;
    const trueValue = meta.trueValue ? meta.trueValue.toString() : "true";
    const label = column.columnDef.header!.toString();
    const filterValue = column.getFilterValue();
    const filteredCount = filteredValues.counts[trueValue] || 0;
    const referenceCount = referenceValues.counts[trueValue] || 0;

    return (
        <div className={styles["filter-boolean-container"]}>
            <div className={styles["filter-boolean-item"]}>
                <Checkbox
                    name={`${column.id}-boolean`}
                    checked={filterValue === trueValue}
                    onChange={(e) => {
                        column.setFilterValue(e.target.checked ? trueValue : undefined);
                    }}
                />
                <span className={styles["filter-boolean-value"]}>{label}</span>
                <FacetCountBadges count={filteredCount} total={referenceCount} />
            </div>
        </div>
    );
};
