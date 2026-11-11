import { Badge, FacetCountBadges } from "../../Badge";
import React, { useState } from "react";

import styles from "./pill-select.module.css";

export interface PillOption {
    value: string;
    count?: number;
    total?: number;
    disabled?: boolean;
}

interface PillSelectProps {
    options: PillOption[];
    label?: string;
    selectedValues: string[];
    variant: PillButtonVariant;
    onChange: (values: string[]) => void;
}

type PillButtonVariant = "default" | "counts" | "faceted-counts";

export const PillSelect = ({ options, label, selectedValues, variant = "default", onChange }: PillSelectProps) => {
    const [visibleCount, setVisibleCount] = useState(10);
    const visibleOptions = options.slice(0, visibleCount);
    const hasMoreOptions = visibleCount < options.length;

    return (
        <div className={styles["pill-select-container"]}>
            {label && <div className={styles["pill-select-field-label"]}>{label}</div>}

            <div className={styles["pill-select-grid"]}>
                {visibleOptions.map((opt, index) => {
                    const isSelected = selectedValues.includes(opt.value);
                    const newValues = isSelected
                        ? selectedValues.filter((v) => v !== opt.value)
                        : [...selectedValues, opt.value];

                    return (
                        <button
                            key={`pill-opt-${index}`}
                            type="button"
                            className={[
                                styles["pill-select-button"],
                                isSelected && styles["pill-select-button-selected"],
                                opt.disabled && styles["pill-select-button-disabled"],
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-pressed={isSelected}
                            onClick={() => onChange(newValues)}
                            disabled={opt.disabled}
                        >
                            <span className={styles["pill-select-button-icon"]}>{isSelected ? "✓" : "+"}</span>
                            <span className={styles["pill-select-button-label"]}>{opt.value}</span>
                            {variant === "faceted-counts" && (
                                <FacetCountBadges variant="pill" size="small" count={opt.count!} total={opt.total!} />
                            )}
                            {variant === "counts" && (
                                <Badge variant="pill" size="small">
                                    {opt.count!}
                                </Badge>
                            )}
                        </button>
                    );
                })}

                {options.length > 10 && (
                    <button
                        type="button"
                        className={styles["pill-select-more-button"]}
                        onClick={() => setVisibleCount(hasMoreOptions ? visibleCount + 10 : 10)}
                    >
                        {hasMoreOptions ? "...show more" : "...show less"}
                    </button>
                )}
            </div>
        </div>
    );
};
