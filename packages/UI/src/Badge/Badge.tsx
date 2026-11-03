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
    const isDisabled = count === 0 ? "-disabled" : "";
    const badgeVariant = variant === "pill" ? "pill" : "badge";
    return (
        <span
            className={`${styles["facet-count-badges"]} ${className}`}
            style={style}
            aria-label={`${count} matching current filters, ${total} total`}
        >
            <Badge size={size} variant={badgeVariant} className={styles[`facet-count-badges-count${isDisabled}`]}>
                {count}
            </Badge>
            <Badge size={size} variant={badgeVariant} className={styles[`facet-count-badges-total${isDisabled}`]}>
                {total}
            </Badge>
        </span>
    );
};
