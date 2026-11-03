# Topic Filter Implementation Plan

**Goal:** Add a full-width “Explore topics” filter below graph filters in “At a Glance.” It combines values from explicitly marked text columns and supports Match all/Match any across the combined row-level topic set.

**Architecture:** Use one hidden, virtual TanStack column so topic filtering participates in normal faceting, active filters, and “Clear all” without modifying table data.

## Implementation Changes

- Extend `ColumnFilteringOpts.isTopic` as an explicit opt-in independent of `disableColumnFilter`.
- Add `TableOptions.topicFilterMaxValues?: number`, defaulting to `15`.
- While building `resolvedColumns`, append an internal topic column when at least one text column has `isTopic: true`.
  - Aggregate marked-column values through an accessor.
  - Split list values using the existing delimiter behavior.
  - Exclude null/NA values and deduplicate within each row.
  - Keep the column permanently hidden and excluded from display, export, and column controls.
- Add `TopicFilterValue` with selected topics and mode (`"all" | "any"`), plus a topic filter function:
  - Match any: at least one selected topic occurs anywhere in the row’s aggregate set.
  - Match all: every selected topic occurs somewhere in that aggregate set.
  - An empty selection removes the internal column filter.
- Add `TopicFilter` to `TextColumnFilters.tsx`.
  - Extract and reuse the pill rendering mechanics from `MultiSelectPillFilter`.
  - Show the top reference topics ordered by distinct row count; do not add an “Other” topic.
  - Count a topic once per row even if it occurs in multiple marked columns.
  - Default to Match all.
  - Keep selected zero-count topics removable.
- Render the topic filter full width beneath the visual-filter grid inside the existing collapsible “At a Glance” section. Show the section when graphs, topics, or both exist.
- Represent the internal filter as one active-filter chip, formatted as `Match all: topic 1, topic 2` or `Match any: …`.

## Interfaces

- `ColumnFilteringOpts.isTopic?: boolean`
  - Only explicit `true` values participate.
  - May be used when the source column’s normal filter is disabled.
- `TableOptions.topicFilterMaxValues?: number`
  - Default: `15`.
- Internal-only metadata identifies the aggregate topic column; it is not exposed as a new `ColumnFilterType`.

## Verification

- Confirm no topic column is created when no eligible columns exist.
- Confirm marked columns contribute even when hidden or individually non-filterable.
- Confirm duplicate topics across fields count once per row.
- Confirm Match any and Match all produce the expected cross-column results.
- Confirm changing mode updates existing results and clearing the final topic removes the filter.
- Confirm other filters update topic facet counts without changing the reference ordering.
- Confirm “Clear all” and chip removal reset the topic UI.
- Confirm the internal column never renders, exports, or appears in column controls.
- Review the diff and run the focused TypeScript check: `npx tsc --noEmit -p packages/Table/tsconfig.json`.
- Do not run the package build unless explicitly requested.

## Assumptions

- Topic values use the existing text-list delimiter conventions.
- The top-topic limit is configurable, with `15` as the default.
- Source columns retain their normal Additional Filters when enabled.
- Existing user changes in the affected files must be preserved.
