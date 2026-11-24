"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./text-content-layout.module.css";

export interface TextContentSection {
    id: string;
    label: string;
}

export interface TextContentLayoutProps {
    intro?: ReactNode;
    children: ReactNode;
    tableOfContents?: TextContentSection[];
    tableOfContentsLabel?: string;
    showTableOfContents?: boolean;
}

export function TextContentLayout({
    intro,
    children,
    tableOfContents,
    tableOfContentsLabel = "On this page",
    showTableOfContents = true,
}: TextContentLayoutProps) {
    const articleRef = useRef<HTMLElement>(null);
    const [detectedSections, setDetectedSections] = useState<TextContentSection[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    useEffect(() => {
        if (!showTableOfContents || tableOfContents !== undefined) {
            return;
        }

        const article = articleRef.current;
        if (!article) return;

        const updateSections = () => {
            const headings = article.querySelectorAll<HTMLHeadingElement>("h2[id]");

            const nextSections = Array.from(headings)
                .map((heading) => ({
                    id: heading.id.trim(),
                    label: heading.textContent?.trim() ?? "",
                }))
                .filter((section) => section.id && section.label);

            setDetectedSections((previous) => {
                const unchanged =
                    previous.length === nextSections.length &&
                    previous.every((section, index) => {
                        const next = nextSections[index];

                        return next !== undefined && section.id === next.id && section.label === next.label;
                    });

                return unchanged ? previous : nextSections;
            });
        };

        updateSections();

        const observer = new MutationObserver(updateSections);

        observer.observe(article, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["id"],
        });

        return () => observer.disconnect();
    }, [tableOfContents, showTableOfContents]);

    const sections = tableOfContents ?? detectedSections;
    useEffect(() => {
        if (!showTableOfContents || sections.length === 0) return;

        const article = articleRef.current;
        if (!article) return;

        const sectionIds = new Set(sections.map((section) => section.id));

        const headings = Array.from(article.querySelectorAll<HTMLHeadingElement>("h2[id]")).filter((heading) =>
            sectionIds.has(heading.id)
        );

        if (headings.length === 0) return;

        const updateActiveSection = () => {
            const activationLine = window.innerHeight * 0.2;

            // Find the last heading that passed the activation line.
            const activeHeading =
                headings
                    .slice()
                    .reverse()
                    .find((heading) => heading.getBoundingClientRect().top <= activationLine) ?? headings[0];

            if (activeHeading) {
                setActiveSectionId(activeHeading.id);
            }
        };

        const observer = new IntersectionObserver(updateActiveSection, {
            rootMargin: "-20% 0px -60% 0px",
            threshold: 0,
        });

        headings.forEach((heading) => observer.observe(heading));

        // Set the active section on initial load.
        updateActiveSection();

        return () => observer.disconnect();
    }, [sections, showTableOfContents]);

    const hasSidebar = showTableOfContents && sections.length > 0;

    const layoutClassName = [
        styles["text-content-layout"],
        !hasSidebar && styles["text-content-layout--without-sidebar"],
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={styles["text-content-page"]}>
            {intro != null && <header className={styles["text-content-intro"]}>{intro}</header>}

            <div className={layoutClassName}>
                {hasSidebar && (
                    <aside className={styles["text-content-sidebar"]}>
                        <nav aria-label={tableOfContentsLabel}>
                            <h2>{tableOfContentsLabel}</h2>

                            <ul>
                                {sections.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            aria-current={activeSectionId === section.id ? "location" : undefined}
                                        >
                                            {section.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                )}

                <article ref={articleRef} className={styles["text-content-article"]}>
                    {children}
                </article>
            </div>
        </div>
    );
}
