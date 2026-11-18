"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Tab, TabBody, TabHeader, Tabs } from "@niagads/ui/client";

import { TableViewContent } from "./TableView";
import { tableDataKey, useTableData } from "./useTableData";
import type { TabbedTableConfig, TableTabConfig } from "./types";
import styles from "./table-view.module.css";

interface TabbedTableViewProps {
    config: TabbedTableConfig;
    selectedTab?: string;
    onTabChange?: (tabId: string) => void;
    /** Optional visible caption and accessible navigation name. */
    label?: string;
}

/** Lazy-mount views once, retaining each table's data and interaction state. */
export const TabbedTableView = ({ config, selectedTab, onTabChange, label }: TabbedTableViewProps) => {
    const { tabs, defaultTab, fetchPolicy = "background" } = config;
    // External selection takes precedence; otherwise use local state initialized once
    // from defaultTab. If the selected local tab is removed, display the first remaining tab.
    const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.id);
    const activeId = selectedTab ?? (tabs.some((tab) => tab.id === internalTab) ? internalTab : tabs[0]?.id);
    const [visited, setVisited] = useState<Set<string>>(() => new Set(activeId ? [activeId] : []));

    // Navigation needs count metadata, not row arrays. Tag counts with their source
    // identity so a late result from a replaced source cannot label the new table.
    const [counts, setCounts] = useState<Record<string, { key: string; count: number }>>({});
    const updateCount = useCallback((id: string, key: string, count: number | undefined) => {
        setCounts((previous) => {
            // Avoid rerendering navigation when a subscriber reports the same metadata.
            if (previous[id]?.key === key && previous[id]?.count === count) return previous;
            const next = { ...previous };
            if (count === undefined) delete next[id];
            else next[id] = { key, count };
            return next;
        });
    }, []);
    // Explicit totals win over loaded-row counts (important for paginated endpoints).
    // Nullish checks retain valid zero counts; an unknown count stays absent.
    const getCount = (tab: TableTabConfig) =>
        tab.count ??
        tab.table.data?.length ??
        (counts[tab.id]?.key === tableDataKey(tab.table) ? counts[tab.id].count : undefined);

    // Visited controls rendering only, independently of fetchPolicy. Retain visited
    // views to preserve their table state, but discard IDs removed from configuration.
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
        // In controlled mode the caller must update selectedTab, e.g. through its router.
        if (selectedTab === undefined) setInternalTab(id);
        onTabChange?.(id);
    };

    return (
        <Tabs variant="integrated" label={label} selectedTab={activeId} onTabChange={selectTab}>
            {tabs.map((tab) => {
                const count = getCount(tab);
                const tabLabel = `${tab.label}${count !== undefined ? ` (${count.toLocaleString("en-US")})` : ""}`;
                return (
                    <Tab key={tab.id} id={tab.id} label={tabLabel}>
                        <TabHeader>
                            {tab.label}
                            {count !== undefined && (
                                <span className={styles.count}> ({count.toLocaleString("en-US")})</span>
                            )}
                        </TabHeader>
                        <TabBody>
                            <TablePanel
                                tab={tab}
                                renderView={visited.has(tab.id) || tab.id === activeId}
                                fetchEnabled={
                                    fetchPolicy === "background" || visited.has(tab.id) || tab.id === activeId
                                }
                                onCount={updateCount}
                            />
                        </TabBody>
                    </Tab>
                );
            })}
        </Tabs>
    );
};

// Each tab has a data subscriber even before its visual table exists. This keeps hooks
// inside a keyed component rather than calling a variable number of hooks in the wrapper.
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
    // Background mode enables all subscribers immediately; onSelect enables visited tabs.
    const state = useTableData(tab.table, fetchEnabled);
    const key = tableDataKey(tab.table);
    const count = state.data?.length;
    useEffect(() => {
        onCount(tab.id, key, count);
    }, [tab.id, key, count, onCount]);
    // Only the expensive table/filter tree is deferred. Once rendered, the wrapper hides
    // it instead of unmounting it, preserving pagination, sorting and filter state.
    return renderView ? <TableViewContent config={tab.table} state={state} /> : null;
}
