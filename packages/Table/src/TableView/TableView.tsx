"use client";

import { ActionButton, Alert, LoadingSpinner } from "@niagads/ui";
import type { DataSourceConfig, TableViewProps } from "./types";
import React, { useEffect, useId, useState } from "react";

import Table from "../Table";
import type { TableData } from "../types";
import styles from "./table-view.module.css";

type RequestState = {
    source: DataSourceConfig;
    attempt: number;
} & ({ status: "loading" } | { status: "success"; data: TableData } | { status: "error"; message: string });

/** A standalone view; it has no knowledge of tab navigation. */
export const TableView = ({ config }: TableViewProps) => {
    const { title, description, dataSource, data, ...tableProps } = config;
    const titleId = useId();
    const [attempt, setAttempt] = useState(0);
    const [request, setRequest] = useState<RequestState | null>(null);

    useEffect(() => {
        if (!dataSource) return;
        const controller = new AbortController();
        let cancelled = false;
        setRequest({ source: dataSource, attempt, status: "loading" });
        Promise.resolve()
            .then(() => {
                if (cancelled) return undefined;
                return dataSource.load(controller.signal);
            })
            .then((rows) => {
                if (!cancelled && rows !== undefined) {
                    setRequest({ source: dataSource, attempt, status: "success", data: rows });
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setRequest({
                        source: dataSource,
                        attempt,
                        status: "error",
                        message: error instanceof Error ? error.message : "Unable to load this table.",
                    });
                }
            });
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [dataSource, attempt]);

    const current = request?.source === dataSource && request?.attempt === attempt ? request : null;
    const loading = !!dataSource && (!current || current.status === "loading");
    const rows = dataSource ? (current?.status === "success" ? current.data : undefined) : data;

    return (
        <section className={styles.view} aria-labelledby={titleId} aria-busy={loading}>
            <header className={styles.header}>
                <h2 id={titleId} className={styles.title}>
                    {title}
                </h2>
                {description && <p className={styles.description}>{description}</p>}
            </header>
            {loading && <LoadingSpinner message="Loading table…" size="sm" />}
            {dataSource && current?.status === "error" && (
                <div className={styles.feedback}>
                    <p role="alert">{current.message}</p>
                    <ActionButton onClick={() => setAttempt((value) => value + 1)}>Retry</ActionButton>
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
