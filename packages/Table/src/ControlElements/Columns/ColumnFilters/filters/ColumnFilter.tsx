import { HistogramFilter, NUMERIC_CELL_TYPES, PValueFilter, TextColumnFilter } from ".";

import { FilterColumn } from "./types";
import React from "react";

/**
 * Renders an appropriate filter UI component based on the column's data type and metadata.
 *
 * For categorical columns with too many unique values (> MAX_FILTER_CATEGORIES):
 * - Keeps the top  categories sorted alphabetically by count (descending)
 * - Groups remaining categories under an "Other" option
 * - The otherValues array tracks which actual values are grouped under "Other"
 * - This allows the filter to correctly expand "Other" back to its constituent values
 *
 * Special handling for N/A values:
 * - N/A values are tracked separately and always displayed
 * - If only N/A values exist before filtering, shows a message prompting adjustment of other filters
 *
 * @param props - The component props
 * @param props.column - The TanStack React Table column instance containing:
 * @returns A filter UI component appropriate for the column type
 */
const ColumnFilter = ({ column }: FilterColumn) => {
    const meta = column.columnDef.meta!;

    if (NUMERIC_CELL_TYPES.includes(meta.type)) {
        if (meta.type === "pvalue") return <PValueFilter column={column} />;
        // if (column.columnDef.meta?.filterType === "range") return  <RangeFitler column={column} />;
        return <HistogramFilter column={column} />;
    }

    return <TextColumnFilter column={column} />;
};

export default ColumnFilter;
