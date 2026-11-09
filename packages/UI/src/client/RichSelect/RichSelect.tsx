import React, { ReactNode, useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";
import styles from "./richselect.module.css";

interface RichSelectProps {
    options: Record<string, ReactNode>;
    onChange: (selection: string) => void;
    disabledOptions?: string[];
    placeholder?: string;
    label?: string;
    value?: string;
}

export const RichSelect = ({ options, onChange, disabledOptions = [], label, placeholder, value }: RichSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [selectedValue, setSelectedValue] = useState(value || "");

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const optionKeys = placeholder ? ["", ...Object.keys(options)] : Object.keys(options);
    const disabledOptionSet = new Set(disabledOptions);

    const findNextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
        let index = startIndex;
        while (index >= 0 && index < optionKeys.length) {
            if (!disabledOptionSet.has(optionKeys[index])) {
                return index;
            }
            index += direction;
        }
        return -1;
    };

    useEffect(() => {
        setSelectedValue(value ?? "");
    }, [value]);

    const longestOption = optionKeys.reduce((longest, key) => {
        const text = key || placeholder || "";
        return text.length > longest.length ? text : longest;
    }, "");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsOpen(true);
                }
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setHighlightedIndex((prev) => {
                        const nextIndex = findNextEnabledIndex(prev + 1, 1);
                        return nextIndex === -1 ? prev : nextIndex;
                    });
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setHighlightedIndex((prev) => {
                        const nextIndex = findNextEnabledIndex(prev - 1, -1);
                        return nextIndex === -1 ? prev : nextIndex;
                    });
                    break;
                case "Enter":
                    e.preventDefault();
                    if (highlightedIndex >= 0) {
                        handleSelect(optionKeys[highlightedIndex]);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    break;
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, highlightedIndex, optionKeys, disabledOptionSet]);

    const handleSelect = (option: string) => {
        if (disabledOptionSet.has(option)) {
            return;
        }
        setSelectedValue(option);
        onChange(option);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    return (
        <div className={styles["rich-select-wrapper"]}>
            {label && <label className={styles["rich-select-label"]}>{label}</label>}
            <div className={styles["rich-select-container"]} ref={containerRef}>
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className={styles["rich-select-button"]}
                    style={{ minWidth: `${longestOption.length * 8 + 40}px` }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-label="Select option"
                >
                    <span className={selectedValue ? styles["rich-select-value"] : styles["rich-select-placeholder"]}>
                        {selectedValue || placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`${styles["rich-select-chevron"]} ${isOpen ? styles["rich-chevron-open"] : ""}`}
                        aria-hidden="true"
                    />
                </button>

                {isOpen && (
                    <div className={styles["rich-select-dropdown"]} role="listbox">
                        {optionKeys.length === 0 ? (
                            <div className={styles["rich-select-no-results"]}>
                                <div className={styles["rich-select-content"]}>
                                    <span className={styles["rich-select-text"]}>No options available</span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {optionKeys.map((optionKey: string, index: number) => {
                                    const isDisabled = disabledOptionSet.has(optionKey);
                                    return (
                                        <div
                                            key={optionKey || "placeholder"}
                                            className={`${styles["rich-select-option"]} ${
                                                index === highlightedIndex ? styles["highlighted"] : ""
                                            } ${optionKey === selectedValue ? styles["selected"] : ""} ${
                                                isDisabled ? styles["disabled"] : ""
                                            }`}
                                            onClick={() => handleSelect(optionKey)}
                                            onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
                                            role="option"
                                            aria-selected={optionKey === selectedValue}
                                            aria-disabled={isDisabled}
                                        >
                                            <span className={styles["rich-select-text"]}>
                                                {optionKey ? optionKey : placeholder}
                                            </span>
                                            {optionKey && (
                                                <div className={styles["rich-select-component"]}>
                                                    {options[optionKey]}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
