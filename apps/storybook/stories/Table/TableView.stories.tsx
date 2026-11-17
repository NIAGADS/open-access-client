import React, { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { TableView, type TableViewConfig } from "@niagads/table";

import { TABLE_DEFINTION as example } from "../../examples/tables/table_rendering_test";

const config: TableViewConfig = {
    ...example,
    title: "Independent table view",
    description: "The same configuration works on its own or inside TabbedTableView.",
};

const meta = {
    title: "Table/TableView",
    component: TableView,
    tags: ["autodocs"],
    parameters: { layout: "padded" },
    args: { config },
} satisfies Meta<typeof TableView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Standalone: Story = {};

export const Empty: Story = {
    args: { config: { ...config, data: [] } },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole("status")).toHaveTextContent("No records found.");
    },
};

export const Loading: Story = {
    args: {
        config: {
            id: "loading-example",
            title: "Loading an independent source",
            columns: example.columns,
            dataSource: {
                load: (signal) =>
                    new Promise((_, reject) => {
                        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
                    }),
            },
        },
    },
    play: async ({ canvasElement }) => {
        await expect(await within(canvasElement).findByRole("status")).toHaveTextContent("Loading table");
    },
};

function RetryExample() {
    const retryConfig = useMemo<TableViewConfig>(() => {
        let attempts = 0;
        return {
            id: "retry-example",
            title: "Recovering a failed request",
            description: "The example source fails once. Retry loads the existing rendering-test table.",
            columns: example.columns,
            dataSource: {
                load: async () => {
                    attempts += 1;
                    if (attempts === 1) throw new Error("The table service is temporarily unavailable.");
                    return example.data;
                },
            },
        };
    }, []);
    return <TableView config={retryConfig} />;
}

export const ErrorAndRetry: Story = {
    render: () => <RetryExample />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole("alert")).toHaveTextContent("temporarily unavailable");
        await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
        await expect(await canvas.findByRole("table")).toBeVisible();
        await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    },
};

function ChangingSourceExample() {
    const [original] = React.useState(() => {
        let complete!: (rows: typeof example.data) => void;
        const pending = new Promise<typeof example.data>((resolve) => {
            complete = resolve;
        });
        return { pending, complete };
    });
    const [aborted, setAborted] = React.useState(false);
    const [replaced, setReplaced] = React.useState(false);
    const originalSource = useMemo(
        () => ({
            load: (signal: AbortSignal) => {
                signal.addEventListener("abort", () => setAborted(true), { once: true });
                // Deliberately ignore cancellation in the returned promise to exercise stale-response protection.
                return original.pending;
            },
        }),
        [original]
    );
    const replacementSource = useMemo(() => ({ load: async () => example.data.slice(1, 2) }), []);
    return (
        <>
            <button type="button" onClick={() => setReplaced(true)}>
                Switch source
            </button>
            <button type="button" onClick={() => original.complete(example.data.slice(0, 1))}>
                Complete original request
            </button>
            {aborted && <p>Original request aborted</p>}
            <TableView
                config={{
                    id: "changing-source",
                    title: "Replacing a pending source",
                    columns: example.columns,
                    dataSource: replaced ? replacementSource : originalSource,
                }}
            />
        </>
    );
}

export const ChangingSource: Story = {
    render: () => <ChangingSourceExample />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByRole("status");
        await userEvent.click(canvas.getByRole("button", { name: "Switch source" }));
        await expect(await canvas.findByText("Original request aborted")).toBeVisible();
        await expect(await canvas.findByRole("cell", { name: "r2" })).toBeVisible();
        await userEvent.click(canvas.getByRole("button", { name: "Complete original request" }));
        await expect(canvas.getByRole("cell", { name: "r2" })).toBeVisible();
        await expect(canvas.queryByRole("cell", { name: "r1" })).toBeNull();
    },
};
