"use client";

import { ActionButton, Alert, LoadingSpinner } from "@niagads/ui";
import React, { useId } from "react";

import Table from "../Table";
import type { TableViewProps } from "./types";
import { useTableData, type TableDataState } from "./useTableData";
import styles from "./table-view.module.css";

/** A standalone view; it has no knowledge of tab navigation. */
export const TableView = ({ config }: TableViewProps) => {
    const state = useTableData(config);
    return <TableViewContent config={config} state={state} />;
};

/** Shared presentation for standalone views and the tab wrapper's data-only panels. */
export const TableViewContent = ({ config, state }: TableViewProps & { state: TableDataState }) => {
    const { title, description, dataSource, data, ...tableProps } = config;
    const titleId = useId();
    const { data: rows, loading, error, retry } = state;

    return (
        <section className={styles.view} aria-labelledby={titleId} aria-busy={loading}>
            <header className={styles.header}>
                <h2 id={titleId} className={styles.title}>
                    {title}
                </h2>
                {description && <p className={styles.description}>{description}</p>}
            </header>
            {loading && <LoadingSpinner message="Loading table…" size="sm" />}
            {error && (
                <div className={styles.feedback}>
                    <p role="alert">{error instanceof Error ? error.message : "Unable to load this table."}</p>
                    <ActionButton onClick={retry}>Retry</ActionButton>
                </div>
            )}
            {rows &&
                (rows.length > 0 ? (
                    <Table {...tableProps} data={rows} />
                ) : (
                    <Alert variant="info" message="No records found." />
                ))}
        </section>
    );
};
