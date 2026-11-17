"use client";

import React, { Children, isValidElement, ReactElement, ReactNode, useEffect, useId, useRef, useState } from "react";

import { Card } from "../../Card";
import { StylingProps } from "../../types";
import styles from "./tabs.module.css";

interface TabsProps extends StylingProps {
    children: ReactElement<TabProps> | ReactElement<TabProps>[];
    onTabChange?: (tabId: string) => void;
    selectedTab?: string;
    defaultTab?: string;
    variant?: "default" | "integrated";
    /** Accessible name for both the desktop tab list and narrow-screen selector. */
    label?: string;
}

export const Tabs = ({
    children,
    onTabChange,
    selectedTab,
    defaultTab,
    variant = "default",
    label,
    className,
    style,
    id,
}: TabsProps) => {
    const tabs = Children.toArray(children) as ReactElement<TabProps>[];
    const instanceId = useId();
    const tabList = useRef<HTMLDivElement>(null);
    const controlled = selectedTab !== undefined;
    const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.props?.id);
    const ids = tabs.map((tab) => tab.props?.id);
    const internalExists = ids.includes(internalTab);
    const firstTabId = ids[0];
    const activeId = controlled ? selectedTab : ids.includes(internalTab) ? internalTab : ids[0];

    // Removing an uncontrolled selection selects the first remaining tab permanently.
    // External selections are never mirrored into local state or changed by this effect.
    useEffect(() => {
        if (!controlled && !internalExists) setInternalTab(firstTabId);
    }, [controlled, internalExists, firstTabId]);

    if (!tabs.length || tabs.some((tab) => !isValidElement(tab) || tab.type !== Tab)) {
        throw new Error("Tabs requires at least one Tab child.");
    }
    if (ids.some((tabId) => !tabId?.trim()) || new Set(ids).size !== ids.length) {
        throw new Error("Tabs requires unique, nonempty tab IDs.");
    }
    if (defaultTab !== undefined && !ids.includes(defaultTab))
        throw new Error(`Tabs defaultTab '${defaultTab}' does not match a tab ID.`);
    if (controlled && !ids.includes(selectedTab))
        throw new Error(`Tabs selectedTab '${selectedTab}' does not match a tab ID.`);

    const selectTab = (tabId: string) => {
        if (tabId === activeId) return;
        // Controlled callers own selection; clicks and keys only notify them.
        if (!controlled) setInternalTab(tabId);
        onTabChange?.(tabId);
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
        tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus({ preventScroll: true });
        selectTab(ids[next]);
    };
    const headerFor = (tab: ReactElement<TabProps>) =>
        Children.toArray(tab.props.children).find((child) => isValidElement(child) && child.type === TabHeader);
    const bodyFor = (tab: ReactElement<TabProps>) =>
        Children.toArray(tab.props.children).find((child) => isValidElement(child) && child.type === TabBody);
    const tabLabel = (tab: ReactElement<TabProps>) => tab.props.label ?? textContent(headerFor(tab));
    const activeIndex = ids.indexOf(activeId);

    return (
        <div id={id} style={style} className={[styles.container, styles[variant], className].filter(Boolean).join(" ")}>
            <div className={styles["tab-container"]} role="tablist" aria-label={label ?? "Tabs"} ref={tabList}>
                {tabs.map((tab, index) => (
                    <button
                        key={tab.props.id}
                        id={`${instanceId}-tab-${index}`}
                        type="button"
                        role="tab"
                        aria-label={tab.props.label}
                        className={`${styles["tab-item"]} ${tab.props.id === activeId ? styles.active : ""}`}
                        aria-selected={tab.props.id === activeId}
                        aria-controls={`${instanceId}-panel-${index}`}
                        tabIndex={tab.props.id === activeId ? 0 : -1}
                        onClick={() => selectTab(tab.props.id)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                    >
                        {headerFor(tab)}
                    </button>
                ))}
            </div>
            <div className={styles.compact}>
                {label && <label htmlFor={`${instanceId}-select`}>{label}</label>}
                <select
                    id={`${instanceId}-select`}
                    value={activeId}
                    aria-label={label ?? "Tabs"}
                    aria-controls={`${instanceId}-panel-${activeIndex}`}
                    onChange={(event) => selectTab(event.target.value)}
                >
                    {tabs.map((tab) => (
                        <option key={tab.props.id} value={tab.props.id}>
                            {tabLabel(tab)}
                        </option>
                    ))}
                </select>
            </div>
            <Card hover={false} outline={variant !== "integrated"} className={styles.panels}>
                {tabs.map((tab, index) => (
                    // Hidden panels stay mounted so consumers keep their own form/table state.
                    <div
                        key={tab.props.id}
                        id={`${instanceId}-panel-${index}`}
                        className={styles.panel}
                        role="tabpanel"
                        aria-labelledby={`${instanceId}-tab-${index}`}
                        tabIndex={0}
                        hidden={tab.props.id !== activeId}
                    >
                        {bodyFor(tab)}
                    </div>
                ))}
            </Card>
        </div>
    );
};

// Rich headers can contain icons or count spans. A Tab.label overrides this text
// extraction when a custom component has no textual children for the native selector.
function textContent(node: ReactNode): string {
    return Children.toArray(node)
        .map((child) => {
            if (typeof child === "string" || typeof child === "number") return String(child);
            return isValidElement<{ children?: ReactNode }>(child) ? textContent(child.props.children) : "";
        })
        .join("");
}

interface TabHeaderProps {
    children: ReactNode;
}
export const TabHeader = ({ children }: TabHeaderProps) => <span>{children}</span>;

interface TabBodyProps {
    children: ReactNode;
}
export const TabBody = ({ children }: TabBodyProps) => <div>{children}</div>;

interface TabProps {
    id: string;
    /** Plain-text alternative for rich headers in the responsive selector. */
    label?: string;
    children: ReactNode;
}
export const Tab = ({ children }: TabProps) => <div>{children}</div>;
