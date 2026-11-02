import { Range, toNegLog10 } from "@niagads/common";
import { RangeSelectHistogram, ThresholdSelectHistogram } from "@niagads/charts";
import React, { useCallback, useMemo } from "react";

import { DEFAULT_NA_VALUE } from "../../../../types";
import { FilterColumn } from "./types";
import { NoValidValueAlert } from "./NoValidValueAlert";
import styles from "./column-filter.module.css";

export const NUMERIC_CELL_TYPES = ["float", "integer", "pvalue", "percentage_cell"];
const HISTOGRAM_DISPLAY_OPTS = {
    width: "100%",
    aspectRatio: 0.6,
} as const;

const _generateDataRange = (values: number[]) =>
    values.length > 0
        ? {
              min: Math.min(...values),
              max: Math.max(...values),
          }
        : undefined;

export const PValueFilter = ({ column }: FilterColumn) => {
    const naValue = column.columnDef.meta?.naValue || DEFAULT_NA_VALUE;
    const title = column.columnDef.header!.toString();

    const referenceData = useMemo(() => {
        const values = (column.getAllValues(true, naValue) as number[]).map((v) => toNegLog10(v));
        return {
            values,
            range: _generateDataRange(values),
        };
    }, [column, naValue]);

    if (!referenceData.range) {
        return <NoValidValueAlert columnName={title} />;
    }

    let filterValue: Range | number | undefined = column.getFilterValue() as Range | number | undefined;

    if (filterValue === undefined) {
        filterValue = referenceData.range.min;
    }

    const handleRangeFilter = useCallback(
        (range: Range) => {
            column.setFilterValue(range.min);
        },
        [column]
    );

    const filteredValues: number[] = (column.getFilteredValues(true, naValue) as number[]).map((v) => toNegLog10(v));

    return (
        <ThresholdSelectHistogram
            limit={filterValue as number}
            limitType="max"
            onRangeSelect={handleRangeFilter}
            data={referenceData.values}
            overlayData={filteredValues}
            numBins={50}
            title={title}
            xAxis={{ label: "-log10 p-value", max: 50 }}
            displayOpts={HISTOGRAM_DISPLAY_OPTS}
            yAxis={{ scale: "log10" }}
        />
    );
};

export const HistogramFilter = ({ column }: FilterColumn) => {
    const naValue = column.columnDef.meta?.naValue || DEFAULT_NA_VALUE;
    const title = column.columnDef.header!.toString();

    const referenceData = useMemo(() => {
        const values = column.getAllValues(true, naValue) as number[];

        return {
            values,
            range: _generateDataRange(values),
        };
    }, [column, naValue]);

    if (!referenceData.range) {
        return <NoValidValueAlert columnName={title} />;
    }

    let filterValue: Range | number | undefined = column.getFilterValue() as Range | number | undefined;

    if (filterValue === undefined) {
        filterValue = referenceData.range;
    }

    const handleRangeFilter = useCallback(
        (range: Range) => {
            // TODO / FIXME: create a filterFn that takes a range
            column.setFilterValue(range);
        },
        [column]
    );

    const filteredValues: number[] = column.getFilteredValues(true, naValue) as number[];

    return (
        <RangeSelectHistogram
            range={filterValue as Range}
            onRangeSelect={handleRangeFilter}
            data={referenceData.values}
            numBins={50}
            title={title}
            overlayData={filteredValues}
            displayOpts={HISTOGRAM_DISPLAY_OPTS}
        />
    );
};
