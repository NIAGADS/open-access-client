import { ExternalLink } from "lucide-react";
import React from "react";

import { StylingProps } from "../types";
import styles from "./linkout.module.css";

export interface LinkOutProps extends StylingProps {
    href: string;
    label: string;
}

export const LinkOut = ({ href, label, className, style, id }: LinkOutProps) => (
    <a
        href={href}
        aria-label={`${label} (opens in a new tab)`}
        title={label}
        target="_blank"
        rel="noopener noreferrer"
        className={[styles.linkout, className].filter(Boolean).join(" ")}
        style={style}
        id={id}
    >
        <ExternalLink size="1em" aria-hidden="true" />
    </a>
);
