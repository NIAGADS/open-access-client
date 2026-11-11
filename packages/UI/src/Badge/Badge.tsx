import React, { ReactNode } from "react";

import { InlineIcon } from "@/src/InlineIcon";
import { StylingProps } from "../types";
import styles from "./badge.module.css";

interface BadgeProps extends StylingProps {
    children: ReactNode;
    icon?: ReactNode;
    iconPosition?: "start" | "end";
    size?: "default" | "small";
    variant?: "badge" | "pill";
}

export const Badge = ({
    children,
    icon,
    iconPosition = "start",
    size = "default",
    variant = "badge",
    className = "",
    style = {},
}: BadgeProps) => {
    const variantClass = [styles.badge, variant === "pill" && styles.pill, size === "small" && styles.small]
        .filter(Boolean)
        .join(" ");

    if (icon) {
        return (
            <span className={`${variantClass} ${className}`} style={style}>
                <InlineIcon icon={icon} children={children} iconPosition={iconPosition}></InlineIcon>
            </span>
        );
    }

    return (
        <span className={`${variantClass} ${className}`} style={style}>
            {children}
        </span>
    );
};

interface FacetCountBadgesProps extends StylingProps {
    count: number;
    total: number;
    variant?: "default" | "pill";
    size?: "small" | "default";
}
export const FacetCountBadges = ({
    count,
    total,
    variant = "default",
    className = "",
    style = {},
    size = "default",
}: FacetCountBadgesProps) => {
    const isDisabled = count === 0;

    const classes = [
        styles["facet-count"],
        variant === "pill" && styles["facet-count-pill"],
        size === "small" && styles["facet-count-small"],
        isDisabled && styles["facet-count-disabled"],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <span
            className={classes}
            style={style}
            aria-label={`${count} matching current filters, ${total} total`}
        >
           <span
                className={styles["facet-count-current"]}
                style={{ minWidth: `${total.toLocaleString().length}ch` }}
            >
                {count.toLocaleString()}
            </span>

            <span className={styles["facet-count-separator"]}>
                /
            </span>

            <span className={styles["facet-count-total"]}>
                {total.toLocaleString()}
            </span>
        </span>
    );
};
