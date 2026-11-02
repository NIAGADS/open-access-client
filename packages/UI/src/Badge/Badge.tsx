import React, { ReactNode } from "react";

import { InlineIcon } from "@/src/InlineIcon";
import { StylingProps } from "../types";
import styles from "./badge.module.css";

interface BadgeProps extends StylingProps {
    children: ReactNode;
    icon?: ReactNode;
    iconPosition?: "start" | "end";
    variant?: "badge" | "pill";
}

export const Badge = ({
    children,
    icon,
    iconPosition = "start",
    variant = "badge",
    className = "",
    style = {},
}: BadgeProps) => {
    const variantClass = variant === "pill" ? `${styles.badge} ${styles.pill}` : styles.badge;

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
}
export const FacetCountBadges = ({ count, total }: FacetCountBadgesProps) => (
    <span className={styles["facet-count-badges"]} aria-label={`${count} matching current filters, ${total} total`}>
        <Badge className={styles["facet-count-badges-count"]}>{count}</Badge>
        <Badge className={styles["facet-count-badges-total"]}>{total}</Badge>
    </span>
);
