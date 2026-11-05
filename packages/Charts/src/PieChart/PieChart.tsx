import * as d3 from "d3";

import { NA_COLOR, PieChartOptions, destroyPieChart, pieChart, updatePieChartSelection } from "./d3PieChart";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import VisualizationInfo, { VisualizationInfoContent } from "../d3/VisualizationInfo";

import { DisplayProps } from "../d3/types";
import { _isNA } from "@niagads/common";
import chartStyles from "../styles/Charts.module.css";
import styles from "./PieChart.module.css";

export interface PieChartDataRow {
    id: string;
    label?: string;
    value: number;
}

export interface PieChartProps {
    data: PieChartDataRow[];
    referenceData?: PieChartDataRow[];
    onClick?: (key: string) => void;
    displayOpts?: DisplayProps;
    maxChartWidth?: number;
    compactLegend?: boolean;
    legendPosition?: "right" | "bottom" | "none";
    preserveSliceOrder?: boolean;
    title?: string;
    visualizationInfo?: VisualizationInfoContent;
}

const getCombinedData = (data: PieChartDataRow[], referenceData?: PieChartDataRow[]): PieChartDataRow[] => {
    const combinedData = new Map<string, PieChartDataRow>();

    referenceData?.forEach((d) => combinedData.set(d.id, d));
    data.forEach((d) => {
        if (!combinedData.has(d.id)) {
            combinedData.set(d.id, d);
        }
    });

    return Array.from(combinedData.values());
};

const Legend = ({
    data,
    referenceData,
    compact,
}: {
    data: PieChartDataRow[];
    referenceData?: PieChartDataRow[];
    compact?: boolean;
}) => {
    const legendData = useMemo(() => getCombinedData(data, referenceData), [data, referenceData]);

    const colorScale = useMemo(() => {
        const scale: Record<string, string> = {};
        legendData.forEach((d, i) => {
            scale[d.id] = d3.schemeCategory10[i % d3.schemeCategory10.length];
        });
        return scale;
    }, [legendData]);

    return (
        <div className={`${styles.legend} ${compact ? styles["legend-compact"] : ""}`}>
            {legendData.map((item) => (
                <div key={item.id} className={styles["legend-item"]}>
                    <div
                        className={styles["legend-color"]}
                        style={{
                            backgroundColor: _isNA(item.id) ? NA_COLOR : colorScale[item.id],
                        }}
                    />
                    <span className={styles["legend-label"]}>{item.label || item.id}</span>
                </div>
            ))}
        </div>
    );
};

const PieChart = ({
    data,
    referenceData,
    onClick,
    displayOpts,
    maxChartWidth,
    compactLegend = false,
    title,
    legendPosition = "right",
    preserveSliceOrder = false,
    visualizationInfo,
}: PieChartProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const requestedWidth = displayOpts?.width || 300;
    const [measuredWidth, setMeasuredWidth] = useState<number | undefined>();

    useLayoutEffect(() => {
        if (maxChartWidth) {
            setMeasuredWidth(undefined);
            return;
        }

        const chart = chartRef.current;
        if (!chart) return;

        const updateMeasuredWidth = () => {
            const nextWidth = chart.clientWidth || undefined;
            setMeasuredWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
        };

        updateMeasuredWidth();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateMeasuredWidth);
            return () => window.removeEventListener("resize", updateMeasuredWidth);
        }

        const resizeObserver = new ResizeObserver(updateMeasuredWidth);
        resizeObserver.observe(chart);
        return () => resizeObserver.disconnect();
    }, [maxChartWidth, requestedWidth]);

    const chartWidth = maxChartWidth ?? measuredWidth ?? (typeof requestedWidth === "number" ? requestedWidth : 300);
    const chartHeight = maxChartWidth ?? displayOpts?.height ?? chartWidth * (displayOpts?.aspectRatio || 1);

    const updatedDisplayOpts = {
        ...displayOpts,
        width: chartWidth,
        height: chartHeight,
    };

    const handleSelect = (id: string) => {
        setSelectedId(id);
        onClick?.(id);
    };

    useEffect(() => {
        if (!chartRef.current) return;

        destroyPieChart(chartRef.current);

        const opts: PieChartOptions = {
            displayOpts: updatedDisplayOpts,
            referenceData,
            onClick: handleSelect,
            preserveSliceOrder,
            selectedId,
        };
        pieChart(chartRef.current, data, opts);

        return () => {
            if (chartRef.current) {
                destroyPieChart(chartRef.current);
            }
        };
    }, [data, referenceData, displayOpts, preserveSliceOrder, chartWidth, chartHeight]);

    // Update selection styling (runs when selectedId changes)
    useEffect(() => {
        if (chartRef.current && selectedId !== undefined) {
            updatePieChartSelection(chartRef.current, selectedId);
        }
    }, [selectedId]);

    return (
        <>
            {(title || visualizationInfo) && (
                <div className={styles["pie-chart-header"]}>
                    {title && <div className={chartStyles["chart-title"]}>{title}</div>}
                    {visualizationInfo && <VisualizationInfo content={visualizationInfo} />}
                </div>
            )}
            <div
                ref={containerRef}
                className={`${styles["pie-chart-wrapper"]} ${styles[`pie-chart-wrapper-${legendPosition}`]} ${
                    maxChartWidth ? styles["pie-chart-wrapper-fixed-chart-size"] : ""
                }`}
                style={{ width: requestedWidth }}
            >
                <div
                    ref={chartRef}
                    style={{ width: "100%", maxWidth: maxChartWidth, height: `${chartHeight}px` }}
                    className={styles["pie-container"]}
                />
                {legendPosition !== "none" && (
                    <div
                        className={`${styles["legend-wrapper"]} ${
                            compactLegend ? styles["legend-wrapper-compact"] : ""
                        }`}
                    >
                        <Legend data={data} referenceData={referenceData} compact={compactLegend} />
                    </div>
                )}
            </div>
        </>
    );
};

export default PieChart;
