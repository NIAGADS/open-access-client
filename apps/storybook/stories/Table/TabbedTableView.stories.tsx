import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TabbedTableView, type TabbedTableConfig } from "@niagads/table";

import { TABLE_DEFINITION as associations } from "../../examples/tables/table_large_numeric_values";
import { TABLE_DEFINTION as tracks } from "../../examples/tables/table_filer";

const config: TabbedTableConfig = {
    defaultTab: "associations",
    tabs: [
        {
            id: "associations",
            label: "Associations",
            count: associations.data.length,
            table: {
                ...associations,
                title: "Alzheimer’s disease associations",
                description: "Existing association-table example, including its graphical filters and column controls.",
            },
        },
        {
            id: "tracks",
            label: "Annotation tracks",
            count: tracks.data.length,
            table: {
                ...tracks,
                title: "Genomic annotation tracks",
                description: "An independent table with its own columns, filters, and retained state.",
                options: { ...tracks.options, enableRowSelect: false },
                rowSelection: undefined,
                onRowSelectionChange: undefined,
            },
        },
    ],
};

function remoteExample(policy: "background" | "onSelect"): TabbedTableConfig {
    return {
        ...config,
        fetchPolicy: policy,
        tabs: config.tabs.map((tab) => ({
            ...tab,
            table: {
                ...tab.table,
                data: undefined,
                description: `${tab.table.description} This example simulates a two-second request.`,
                dataSource: {
                    type: "custom",
                    cacheKey: `storybook-table-${policy}-${tab.id}`,
                    load: async () => {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        return tab.id === "associations" ? associations.data : tracks.data;
                    },
                },
            },
        })),
    };
}

const backgroundConfig = remoteExample("background");
const onSelectConfig = remoteExample("onSelect");

const meta = {
    title: "Table/TabbedTableView",
    component: TabbedTableView,
    tags: ["autodocs"],
    parameters: { layout: "padded" },
    args: { config },
} satisfies Meta<typeof TabbedTableView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConnectedFolders: Story = {
    name: "Default",
    args: { config: backgroundConfig },
    parameters: {
        docs: {
            description: {
                story: "Both simulated requests start immediately. Each takes two seconds. Wait on the first table, then switch: the second table is already available. Counts are supplied in advance.",
            },
        },
    },
};

export const ConstrainedWidth: Story = {
    name: "Mobile Responsive View",
    render: (args) => (
        <div style={{ maxWidth: 420 }}>
            <TabbedTableView {...args} />
        </div>
    ),
};

function ControlledExample() {
    const [selectedTab, setSelectedTab] = useState("tracks");
    return (
        <>
            <p>
                Controlled selection: {selectedTab}. A router can own this state and update it on back/forward
                navigation.
            </p>
            <button type="button" onClick={() => setSelectedTab("associations")}>
                Open associations externally
            </button>
            <TabbedTableView config={config} selectedTab={selectedTab} onTabChange={setSelectedTab} />
        </>
    );
}

export const Controlled: Story = {
    name: "External Tab Control",
    render: () => <ControlledExample />,
};

export const LazySources: Story = {
    name: "Load on Select",
    args: { config: onSelectConfig },
    parameters: {
        docs: {
            description: {
                story: 'Explicit fetchPolicy: "onSelect". Each table starts its simulated two-second request only when first selected. Switching back uses the cached data and preserves table state.',
            },
        },
    },
};
