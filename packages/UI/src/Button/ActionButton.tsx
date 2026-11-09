import React, { ReactNode } from "react";

import { StylingProps } from "../types";
import styles from "./action-button.module.css";

export interface ActionButtonProps extends StylingProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    icon?: ReactNode;
    /** ghost - Borderless style for lightweight contextual actions, such as help icons. */
    variant?: "default" | "ghost";
}

/** A compact, icon-leading control for contextual actions. */
export const ActionButton = ({ children, className, icon, id, style, variant = "default", ...rest }: ActionButtonProps) => (
    <button 
        type="button" 
        id={id}  
        className={`${styles["action-button"]} ${
            variant === "ghost" ? styles["action-button-ghost"] : ""
        } ${className ?? ""}`} 
        style={style} 
        {...rest}
    >
        {icon}
        <span>{children}</span>
    </button>
);
