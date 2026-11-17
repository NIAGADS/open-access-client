"use client";

import React, { useEffect, useId, useRef, useState } from "react";

import { TableView } from "./TableView";
import type { TabbedTableViewProps } from "./types";
import styles from "./table-view.module.css";

/** Lazy-mount views once, retaining each table's data and interaction state. */
export const TabbedTableView = ({ config, selectedTab, onTabChange, label = "Tables" }: TabbedTableViewProps) => {
    const { tabs, defaultTab } = config;
    const instanceId = useId();
    const tabList = useRef<HTMLDivElement>(null);
    const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.id);
    const activeId = selectedTab ?? (tabs.some((tab) => tab.id === internalTab) ? internalTab : tabs[0]?.id);
    const [visited, setVisited] = useState<Set<string>>(() => new Set(activeId ? [activeId] : []));

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
                        {tab.count !== undefined && (
                            <span className={styles.count}> ({tab.count.toLocaleString("en-US")})</span>
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
                            {tab.count !== undefined ? ` (${tab.count.toLocaleString("en-US")})` : ""}
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
                        {(visited.has(tab.id) || tab.id === activeId) && <TableView config={tab.table} />}
                    </div>
                ))}
            </div>
        </div>
    );
};
