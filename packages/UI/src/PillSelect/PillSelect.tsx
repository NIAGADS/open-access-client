import { FacetCountBadges } from "../Badge";
import React from "react";
import styles from "./pill-select.module.css";

export interface PillOption {
    value: string;
    count: number;
    total: number;
    disabled: boolean;
}

interface PillSelectProps {
    options: PillOption[];
    label?: string;
    selectedValues: string[];
    onChange: (values: string[]) => void;
}

export const PillSelect = ({ options, label, selectedValues, onChange }: PillSelectProps) => {
    return (
        <div className={styles["pill-select-container"]}>
            {label && <div className={styles["filter-field-label"]}>{label}</div>}

            <div className={styles["pill-select-grid"]}>
                {options.map((opt, index) => {
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
                            <FacetCountBadges variant="pill" size="small" count={opt.count} total={opt.total} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
