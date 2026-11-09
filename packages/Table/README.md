# NIAGADS Table

`@niagads/table` is a client-side React table built on TanStack Table with integrated support for common data types (e.g., p-values) found in genetic association data. It provides global search, sorting, pagination, column visibility controls, optional exports, column filters, aggregate topic filtering, and controlled row selection.

## Installation

```bash
npm install @niagads/table
```

## Basic usage

Each row must provide exactly one value for every declared column. A value may be a primitive, `null`, or a cell object.

```tsx
import Table, { type TableConfig } from "@niagads/table";

const table: TableConfig = {
    id: "variants",
    options: {
        title: "Variants",
        enableColumnFilters: true,
        enableExport: true,
        defaultColumns: ["variant", "p_value", "consequence"],
    },
    columns: [
        { id: "variant", header: "Variant", type: "link", required: true },
        { id: "p_value", header: "P value", type: "pvalue" },
        {
            id: "consequence",
            header: "Consequence",
            filterOpts: { filterGroup: "Annotation" },
        },
    ],
    data: [
        {
            variant: { value: "rs429358", url: "/variant/rs429358" },
            p_value: 2.3e-12,
            consequence: "missense_variant",
        },
    ],
};

export function VariantTable() {
    return <Table {...table} />;
}
```

`TableConfig` accepts `id`, `columns`, `data`, and optional `options`, `rowSelection` props.

In this example, the options enable the optional filter controls and export menu. `defaultColumns` lists the columns visible on first render. The `variant` column is `required`, so a user cannot hide it from the column-visibility menu. `filterGroup: "Annotation"` places the Consequence filter in that named group when filter controls are shown. The `link` and `pvalue` column types select their respective cell renderers and affect sorting and filtering behavior.

## Table options

Pass options through the `options` prop.

| Option | Description |
| --- | --- |
| `title` | Optional table title metadata. It is not rendered by the Table component. |
| `description` | Optional descriptive metadata. It is not rendered by the Table component. |
| `enableColumnFilters` | Shows column-filter controls when `true`. Defaults to `false`. |
| `enableExport` | Shows the export menu when `true`. Defaults to `false`. Exports visible columns as CSV, TSV, JSON, or XLS. |
| `enableRowSelect` | Adds a selection column and selected-row controls when `true`. Defaults to `false`. |
| `rowSelectOpts` | Configuration required for useful row selection; see [Row selection](#row-selection). |
| `defaultColumns` | IDs of the columns initially visible. Columns omitted from this list start hidden. Required columns remain visible. |
| `onTableLoad` | Called with the TanStack Table instance after layout. See [Accessing the table instance](#accessing-the-table-instance). |
| `filterGroupOrder` | Ordered list of additional-filter group names to render. Groups not listed here are not rendered. |
| `initialize` | Declared for initial sort/filter state **NOT YET IMPLEMENTED** |

The built-in toolbar always includes global text search and, when at least one column is hideable, a column-visibility menu. Pagination is always enabled.

## Columns

| Option | Description |
| --- | --- |
| `id` | Required data-field and column ID. |
| `header` | Display label. Defaults to a title-cased `id`. |
| `description` | Help text stored in the column metadata. |
| `type` | Cell renderer type; defaults to text. See [Cell types and renderers](#cell-types-and-renderers). |
| `disableGlobalFilter` | Excludes this column from global search. |
| `disableColumnFilter` | Disables its column filter and prevents the default filter type from being assigned. |
| `disableSorting` | Disables header sorting. |
| `required` | Prevents the column from being hidden. |
| `filterOpts` | Filter presentation, grouping, values, and behavior; see [Filtering](#filtering). |
| `valueDisplayOpts` | Null, N/A, boolean-label, and numeric precision display settings. |
| `styling` | Functions that provide a class name and/or inline style from the original cell value. |
| `sortingFn` | A TanStack sorting function or built-in sorting-function name. Defaults are type-aware. |

### Value display and styling

Users can define functions that apply column-level based styling or apply CSS classes based on column values as follows:

```tsx
{
    id: "odds_ratio",
    type: "float",
    valueDisplayOpts: { precision: 3, nullValue: "Not reported" },
    styling: {
        getClassName: (value) => (Number(value) >= 1 ? "positive-effect" : "negative-effect"),
        getStyle: (value) => ({ fontWeight: Number(value) >= 2 ? 700 : undefined }),
    },
}
```

or specifiy styling for specific cells `className` or `style` properties (see below).

`naValue` defaults to `"n/a"`. For boolean columns, `trueValue` replaces the rendered label for `true`; use a cell object's `displayText` when the label varies by cell.

## Cell types and renderers

The supported public column `type` values are:

| Type | Renderer and data shape |
| --- | --- |
| `text` or omitted | Text/Base class. An object may include `value`, `info`, `truncateTo`, `className`, or `style`. |
| `link` | Link. Supply `{ url, value? , target? }`; `value` defaults to `url`. |
| `integer` | Numeric text without decimal formatting. |
| `float` | Numeric text, formatted with `precision` when supplied. |
| `pvalue` | Numeric text for p-values; string values are preserved.  Renders using scientific notation and assumes value-type specific sorting & filtering rules. |
| `percentage_bar` | Numeric percentage-bar renderer. |
| `badge` | Text badge; accepts `icon` and `iconOnly` on a cell object. |
| `boolean` | Boolean badge. Supply a boolean or `null`; `displayText` can override an individual label. |
| `abstract` | Internal/base text behavior; normally omit it and use `text`. |

For a `text` or `link` column only, a row value can be an array of cells. The Table renders it as a text or link list and uses its values for filtering. Other column types do not accept array values.

## Filtering

Set `enableColumnFilters: true` to show the filter UI. By default, numeric columns use a histogram, boolean columns use a boolean control, and other filterable columns use a select control.

`filterOpts` supports the following fields:

| Option | Description |
| --- | --- |
| `filterType` | One of `histogram`, `pie`, `select`, `multiselect`, `boolean`, or `range`. Numeric columns render numeric filters; p-value columns use a p-value filter. `range` is accepted by the type but has no specialized range UI yet. |
| `filterFn` | A TanStack filter function or function name. When `filterType` is `multiselect`, the built-in `includesAny` filter is used. |
| `filterGroup` | Places an additional filter under this group label. Use `filterGroupOrder` to control group order. |
| `valueColumn` | Uses another column's precomputed values for filter summaries. P-value columns expect `-log10(p)` values. |
| `isTopic` | Includes the column in the aggregate Topics filter. Defaults to `true` for `select`, `multiselect`, and `pie` filters. |
| `modelPath` | Reserved for text-extraction topic filtering; it is currently not consumed by the Table component. |

```tsx
{
    id: "population",
    filterOpts: {
        filterType: "multiselect",
        filterGroup: "Sample context",
        isTopic: false,
    },
}
```

Columns marked as topics contribute their values to an internal aggregate `Topics` multiselect filter. This internal column is hidden from the table itself. Set `isTopic: false` for categorical columns that should not contribute to it.

## Row selection

Selection is controlled: pass the current selection as either a TanStack `RowSelectionState` or an array of selected row IDs, then update it through `onRowSelectionChange`. Set `rowUniqueKey` to a column whose resolved values are unique; it becomes the row ID and is validated at runtime.

```tsx
import Table, { type RowSelectionState } from "@niagads/table";
import { useState } from "react";

function SelectableTable() {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    return (
        <Table
            id="variants"
            columns={columns}
            data={data}
            options={{
                enableRowSelect: true,
                rowSelectOpts: {
                    header: "Select",
                    description: "Select variants for comparison",
                    rowUniqueKey: "variant_id",
                    enableMultiSelect: true,
                    maxSelectedRows: 25,
                    onRowSelectionChange={setRowSelection}
                },
            }}
            rowSelection={rowSelection}
          
        />
    );
}
```

`enableMultiSelect` defaults to `false`, which renders radio buttons and permits one selected row. When provided, `maxSelectedRows` must be a positive integer and prevents additional selections beyond the limit. The selected-row controls let users remove selections or temporarily show selected rows only; enabling that view clears column filters.

## Accessing the table instance

Use `onTableLoad` for integration with the underlying TanStack instance, such as inspecting rows or connecting external controls. It runs after the component lays out and can run again if the table/options change.

```tsx
<Table
    id="variants"
    columns={columns}
    data={data}
    options={{
        onTableLoad: (table) => {
            console.log(table.getCoreRowModel().rows.length);
        },
    }}
/>
```

## Notes and constraints

- `defaultColumns` controls only the initial visibility state. Changes to it after mount do not reset user visibility choices.
- The component accepts `title` and `description` as option metadata but does not render them.
