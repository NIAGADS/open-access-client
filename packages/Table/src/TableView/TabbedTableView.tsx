"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { TableViewContent } from "./TableView";
import { tableDataKey, useTableData } from "./useTableData";
import type { TableTabConfig, TabbedTableViewProps } from "./types";
import styles from "./table-view.module.css";

/** Lazy-mount views once, retaining each table's data and interaction state. */
export const TabbedTableView = ({ config, selectedTab, onTabChange, label = "Tables" }: TabbedTableViewProps) => {
    const { tabs, defaultTab, fetchPolicy = "background" } = config;
    const instanceId = useId();
    const tabList = useRef<HTMLDivElement>(null);
    const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.id);
    const activeId = selectedTab ?? (tabs.some((tab) => tab.id === internalTab) ? internalTab : tabs[0]?.id);
    const [visited, setVisited] = useState<Set<string>>(() => new Set(activeId ? [activeId] : []));

    const [counts, setCounts] = useState<Record<string, { key: string; count: number }>>({});
    const updateCount = useCallback((id: string, key: string, count: number | undefined) => {
        setCounts((previous) => {
            if (previous[id]?.key === key && previous[id]?.count === count) return previous;
            const next = { ...previous };
            if (count === undefined) delete next[id];
            else next[id] = { key, count };
            return next;
        });
    }, []);
    const getCount = (tab: TableTabConfig) =>
        tab.count ??
        tab.table.data?.length ??
        (counts[tab.id]?.key === tableDataKey(tab.table) ? counts[tab.id].count : undefined);

    useEffect(() => {
        setVisited((previous) => {
            const retained = new Set(
                tabs.filter((tab) => previous.has(tab.id) || tab.id === activeId).map((tab) => tab.id)
            );
            return retained.size === previous.size && [...retained].every((id) => previous.has(id))
                ? previous
                : retained;
        });
    }, [activeId, tabs]);

    if (
        tabs.length === 0 ||
        tabs.some((tab) => !tab.id.trim()) ||
        new Set(tabs.map((tab) => tab.id)).size !== tabs.length
    ) {
        throw new Error("TabbedTableView requires at least one tab and unique, nonempty tab IDs.");
    }
    if (defaultTab !== undefined && !tabs.some((tab) => tab.id === defaultTab)) {
        throw new Error(`TabbedTableView defaultTab '${defaultTab}' does not match a tab ID.`);
    }
    if (selectedTab !== undefined && !tabs.some((tab) => tab.id === selectedTab)) {
        throw new Error(`TabbedTableView selectedTab '${selectedTab}' does not match a tab ID.`);
    }

    const selectTab = (id: string) => {
        if (id === activeId) return;
        if (selectedTab === undefined) setInternalTab(id);
        onTabChange?.(id);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next: number;
        switch (event.key) {
            case "ArrowRight":
                next = (index + 1) % tabs.length;
                break;
            case "ArrowLeft":
                next = (index - 1 + tabs.length) % tabs.length;
                break;
            case "Home":
                next = 0;
                break;
            case "End":
                next = tabs.length - 1;
                break;
            default:
                return;
        }
        event.preventDefault();
        tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        selectTab(tabs[next].id);
    };

    return (
        <div className={styles.container}>
            <div className={styles.tabs} ref={tabList} role="tablist" aria-label={label}>
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        id={`${instanceId}-tab-${index}`}
                        type="button"
                        className={styles.tab}
                        role="tab"
                        aria-selected={tab.id === activeId}
                        aria-controls={`${instanceId}-panel-${index}`}
                        tabIndex={tab.id === activeId ? 0 : -1}
                        onClick={() => selectTab(tab.id)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                    >
                        {tab.label}
                        {getCount(tab) !== undefined && (
                            <span className={styles.count}> ({getCount(tab)?.toLocaleString("en-US")})</span>
                        )}
                    </button>
                ))}
            </div>
            <div className={styles.compact}>
                <label htmlFor={`${instanceId}-select`}>{label}</label>
                <select
                    id={`${instanceId}-select`}
                    value={activeId}
                    onChange={(event) => selectTab(event.target.value)}
                >
                    {tabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>
                            {tab.label}
                            {getCount(tab) !== undefined ? ` (${getCount(tab)?.toLocaleString("en-US")})` : ""}
                        </option>
                    ))}
                </select>
            </div>
            <div className={styles.panels}>
                {tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        id={`${instanceId}-panel-${index}`}
                        role="tabpanel"
                        aria-labelledby={`${instanceId}-tab-${index}`}
                        tabIndex={0}
                        hidden={tab.id !== activeId}
                    >
                        <TablePanel
                            tab={tab}
                            renderView={visited.has(tab.id) || tab.id === activeId}
                            fetchEnabled={fetchPolicy === "background" || visited.has(tab.id) || tab.id === activeId}
                            onCount={updateCount}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

function TablePanel({
    tab,
    renderView,
    fetchEnabled,
    onCount,
}: {
    tab: TableTabConfig;
    renderView: boolean;
    fetchEnabled: boolean;
    onCount: (id: string, key: string, count: number | undefined) => void;
}) {
    const state = useTableData(tab.table, fetchEnabled);
    const key = tableDataKey(tab.table);
    const count = state.data?.length;
    useEffect(() => {
        onCount(tab.id, key, count);
    }, [tab.id, key, count, onCount]);
    return renderView ? <TableViewContent config={tab.table} state={state} /> : null;
}
