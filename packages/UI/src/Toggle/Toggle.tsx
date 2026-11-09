
import React, { ReactNode } from "react";

import { StylingProps } from "../types";
import styles from "./toggle.module.css";

type ToggleVariant = "default" | "primary";

interface ToggleProps extends StylingProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    variant: ToggleVariant;
    truncateLabel?: boolean;
}

function truncate(label: string, maxLength = 15): string {
    if (label.length <= maxLength) return label;
    return label.slice(0, maxLength) + "...";
}

export const Toggle = ({
    checked,
    onChange,
    disabled = false,
    label = "",
    variant = "default",
    truncateLabel = false,
    className = "",
    style = {},
}: ToggleProps) => {
    return (
        <label className={`${styles["toggle-switch"]} ${className}`} style={style}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className={styles["toggle-input"]}
            />
            <span className={`${styles["toggle-slider"]} ${variant !== "default" ? styles[variant] : ""}`} />
           {label && (
                <span
                    className={`${styles["toggle-label"]} ${truncateLabel ? styles["toggle-label-truncated"] : ""}`}
                    title={truncateLabel ? label : undefined}
                >
                    {label}
                </span>
            )}
        </label>
    );
};

export interface ToggleGroupProps extends StylingProps {
    children: ReactNode;
    asGrid: boolean;
}

export const ToggleGroup = ({ children, asGrid = false, className = "", style = {} }: ToggleGroupProps) => {
    return (
        <div
            className={`${styles["toggle-group"]} ${asGrid ? styles["toggle-group-grid"] : styles["toggle-group-column"]} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
};
