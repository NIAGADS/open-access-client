import { HelpIconWrapper, StylingProps } from "@niagads/ui";
import React, { useState } from "react";
import { TextRenderer, renderNullValue } from ".";
import { _deepCopy, _get, _hasOwnProperty, _isJSON, _isNA, _isNull } from "@niagads/common";

import { DEFAULT_NA_VALUE } from "../../types";
import { __values } from "tslib";
import styles from "./cell.module.css";

const DEFAULT_MAX_LENGTH = 100;
const DEFAULT_VISIBLE_LIST_ITEMS = 3;

interface StyledTextProps extends StylingProps {
    value: string;
}

export const StyledText = ({ value, className = "", style = {} }: StyledTextProps) => {
    return (
        <span className={`${className}`} style={style}>
            {value}
        </span>
    );
};

export const TextList = <T,>({ props }: TextRenderer<T>) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const items = _get("items", props);
    if (items) {
        const remainingItemCount = items.length - DEFAULT_VISIBLE_LIST_ITEMS;
        const visibleItems = isExpanded ? items : items.slice(0, DEFAULT_VISIBLE_LIST_ITEMS);
        return (
            <div className={styles["truncated-text"]}>
                {visibleItems.map((item: string, index: number) => (
                    <React.Fragment key={`item-${index}`}>
                        <Text props={{ ...props, value: item, items: null }} />
                        {index < visibleItems.length - 1 ? " · " : ""}
                    </React.Fragment>
                ))}
                {remainingItemCount > 0 && (
                    <>
                        {" "}
                        <a className={`text-xs ${styles["info-link"]}`} onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? "Show Less" : `+${remainingItemCount} more`}
                        </a>
                    </>
                )}
            </div>
        );
    }
    return renderNullValue(_get("nullValue", props, DEFAULT_NA_VALUE));
};

export const Text = <T,>({ props }: TextRenderer<T>) => {
    const value: string | null = _get("value", props);

    // handle NAs
    if (_isNull(value)) {
        return renderNullValue(_get("nullValue", props, DEFAULT_NA_VALUE));
    }

    if (_isNA(value)) {
        return renderNullValue(_get("naValue", props, DEFAULT_NA_VALUE));
    }

    if (typeof value === "string" && value.includes("//")) {
        // b/c of how values are resolved in table generation for sort/filter
        // some lists are already transformed to delimited strings, need
        // to transform back
        return <TextList props={{ ...props, items: value.split("//") }} />;
    }

    // handle large text
    const maxLength = _get("truncateTo", props, DEFAULT_MAX_LENGTH);
    if (value.length > maxLength) {
        return <LargeText props={props} />;
    }

    // styling
    const style = _get("style", props);
    const className = _get("className", props);
    const styledText = <StyledText value={value} style={style} className={className} />;

    // info bubbles
    const info = _get("info", props);
    if (info) {
        return (
            <HelpIconWrapper message={info} variant={"info"}>
                {styledText}
            </HelpIconWrapper>
        );
    }

    return styledText;
};

export const LargeText = <T,>({ props }: TextRenderer<T>) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const toggleIsExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const value = _get("value", props);

    if (_isNull(value)) {
        return renderNullValue(_get("nullValue", props));
    }

    if (_isNA(value)) {
        return renderNullValue(_get("naValue", props, DEFAULT_NA_VALUE));
    }

    const hasTooltip = _hasOwnProperty("info", props);
    const maxLength = _get("truncateTo", props, DEFAULT_MAX_LENGTH);
    const truncatedValue = `${value.slice(0, maxLength - 3)}...`;

    if (hasTooltip) {
        const newProps = _deepCopy(props);
        newProps.value = truncatedValue;
        return <Text props={newProps} />;
    }

    // styling
    const style = _get("style", props);
    const className = _get("className", props);
    const styledText = <StyledText value={isExpanded ? value : truncatedValue} style={style} className={className} />;

    const action = isExpanded ? "Show Less" : "Show More";
    return (
        <div className={styles["truncated-text"]}>
            {styledText}
            {"   "}
            <a className={`text-xs ${styles["info-link"]}`} onClick={toggleIsExpanded}>
                {action}
            </a>
        </div>
    );
};
