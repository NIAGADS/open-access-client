"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./about-page.module.css";

interface AboutLayoutProps {
    intro: ReactNode;
    children: ReactNode;
}

interface TocItem {
    id: string;
    label: string;
}

export function AboutLayout({ intro, children }: AboutLayoutProps) {
    const articleRef = useRef<HTMLElement>(null);
    const [sections, setSections] = useState<TocItem[]>([]);

    useEffect(() => {
        const headings = articleRef.current?.querySelectorAll<HTMLHeadingElement>("h2[id]");

        const items = Array.from(headings ?? [])
            .map((heading) => ({
                id: heading.id,
                label: heading.textContent?.trim() ?? "",
            }))
            .filter((item) => item.label);

        setSections(items);
    }, []);

    return (
        <div className={styles["about-page"]}>
            <header className={styles["about-intro"]}>{intro}</header>

            <div className={styles["about-layout"]}>
                <aside className={styles["about-sidebar"]}>
                    <nav aria-label="On this page">
                        <h2>On this page</h2>

                        <ul>
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`}>{section.label}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                <article ref={articleRef} className={styles["about-article"]}>
                    {children}
                </article>
            </div>
        </div>
    );
}
