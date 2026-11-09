import React, { useId } from "react";
import styles from "./checkbox.module.css";

export type CheckboxVariants = "default" | "primary" | "secondary" | "pink" | "accent";
export interface CheckboxProps {
    variant?: CheckboxVariants;
    name: string;
    label?: string;
    checked?: boolean;
    value?: string;
    defaultChecked?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void | null;
    disabled?: boolean;
    alignCenter?: boolean;
}

export const Checkbox = ({
    variant = "secondary",
    name,
    value,
    label,
    onChange,
    disabled = false,
    checked = false,
    defaultChecked = false,
    alignCenter = false,
}: CheckboxProps) => {
    const className = [styles["ui-checkbox"], styles[variant]].filter(Boolean).join(" ");
    const checkboxId = useId();
    return (
       <div
            className={[
                styles["checkbox-wrapper"],
                alignCenter ? styles["centered"] : "",
            ].filter(Boolean).join(" ")}
        >
            {defaultChecked ? (
                <input
                    type="checkbox"
                    id={checkboxId}
                    className={className}
                    name={name}
                    onChange={onChange}
                    disabled={disabled}
                    value={value}
                    defaultChecked={defaultChecked}
                />
            ) : (
                <input
                    type="checkbox"
                    id={checkboxId}
                    className={className}
                    name={name}
                    onChange={onChange}
                    disabled={disabled}
                    checked={checked}
                    value={value}
                />
            )}

            {label && <label htmlFor={checkboxId} className={styles["ui-checkbox-label"]}>{label}</label>}
        </div>
    );
};
