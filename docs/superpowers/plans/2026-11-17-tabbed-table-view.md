# Tabbed Table View Implementation Plan

**Goal:** Implement the approved connected-folder table view in `packages/Table`, with Storybook UI tests.
**Architecture:** `TableView` composes the existing Table and its configuration. It owns independent title, description, remote loading/error/retry/empty states. `TabbedTableView` owns only navigation and lazy retained panels. No application integration or deployment.
**Tech stack:** Existing React, TypeScript, CSS modules, Storybook and browser automation. No new dependencies.
**Spec:** The user-approved design supplied in this conversation: connected folder tabs encompass the entire table view, minimal padding, independent labels and titles, independent first-selection requests, retained data/filter/sort/page/visibility state, optional counts and URL-backed selection, dropdown at constrained widths.

## Global constraints

- Work on `feature/tabbed-table-view`; no additional worktree or subagents.
- Change only Table, its stories, and this implementation record.
- Reuse TableProps/TableColumn/TableOptions; do not modify the existing Table or filters.
- Avoid app/package builds without explicit authorization. Storybook development already resolves Table source.

## Review focus

- Unselected remote tabs must not fetch; revisiting must not remount/reset a table.
- Requests must abort on unmount or source replacement and ignore stale responses.
- Multiple instances must have distinct ARIA IDs; keyboard and dropdown must select the same panel.
- Invalid/empty/duplicate tab configuration must produce actionable errors.
- Controlled selection must support externally driven navigation; unknown selections must not silently show another tab.

## Task 1: Standalone table view

- [x] Define/export TableViewConfig and DataSourceConfig using existing table types and static-data/loader alternatives.
- [x] Add TableView with title/description, abortable loader, visible loading/error/retry/empty states.
- [x] Add standalone Storybook stories using existing examples, including error/retry and empty data.
- [x] Type-check Table; validate loader states in browser.

## Task 2: Connected tab wrapper

- [x] Define/export TableTabConfig, TabbedTableConfig and controlled/uncontrolled props.
- [x] Add accessible connected tabs with arrow/Home/End navigation, lazy retained panels and optional counts.
- [x] Use a container-width dropdown below 40rem, keeping the same selection and table instances.
- [x] Add interaction story testing lazy calls, preserved search/page/visibility and keyboard selection, plus responsive and controlled examples.
- [x] Run Storybook dev and browser tests against the actual stories, check CSS/type output, review scoped diff.

## Execution decisions

The user supplied the approved spec and requested execution. Implement inline, preserving the existing feature checkout. URL behavior is exposed through controlled props rather than hard-coded browser routing. Loaders adapt remote responses to existing TableData; endpoint and authentication details stay outside the wrapper. Visited tables remain mounted for the component lifetime, trading memory per visited tab for exact state preservation. Config IDs identify persistent views; change IDs to reset them.

## Validation results

- Nine Storybook stories exercised in system Chromium through Playwright; all play functions finished successfully with no browser page exceptions.
- ConnectedFolders verifies independent search plus retained sorting, pagination/page size and column visibility; LazySources verifies first-selection-only loaders and no repeat requests on revisit.
- ConstrainedWidth verifies dropdown navigation; browser verification at 390px confirms no page-level horizontal overflow. Controlled verifies externally changed selection and callbacks.
- Standalone, Empty, Loading, ErrorAndRetry and ChangingSource verify view states, retry, cancellation and ignored stale responses.
- Prettier and git diff --check pass.
- Package and story type checks, with command-line ignoreDeprecations=5.0 for the installed TypeScript, report the pre-existing missing ../../types import in ControlElements/Columns/ColumnFilters/sortingFunctions.ts. A compiler-host comparison against the original index and file set reports identical baseline/current diagnostics, with no new diagnostics.
- No package/application production builds, application changes, deployments, dependency changes or lockfile changes. Table source is resolved directly by the existing Storybook Vite alias.
- Reviewed implementation and scoped diff locally; repository instructions prohibit subagents. Implementation prepared for review on feature/tabbed-table-view.

## Revised source and fetch policy — 2026-11-17

The user requested background fetching by default and application-specific opt-in to fetching on selection. Implemented a lightweight SWR data subscriber per tab, separate from lazy table rendering. Source configuration now supports a browser-accessible JSON file path, endpoint URL, or custom loader with a stable cache key. HTTP/JSON loading is built in; optional selectors adapt wrapped responses. Counts use explicit metadata first, then loaded array length. SWR deduplicates and retains data without automatic focus/reconnect/stale revalidation or error retries. Shared requests can finish after unmount rather than aborting another consumer's work.

Preserved the user's pulled UI edits at 376472c2, including the informational empty-state Alert. Renamed stories to describe fetch policies, responsive navigation and application-controlled selection. Stories remain passive, and simulated two-second requests make policy differences visible. A small public JSON fixture is derived from the existing rendering example for the file-source story. No Storybook tests or unrelated application changes were introduced.
