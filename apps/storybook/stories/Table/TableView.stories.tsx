import React, { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
};
