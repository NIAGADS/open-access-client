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

const meta = {
    title: "Table/TabbedTableView",
    component: TabbedTableView,
    tags: ["autodocs"],
    parameters: { layout: "padded" },
    args: { config },
} satisfies Meta<typeof TabbedTableView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConnectedFolders: Story = {};

export const ConstrainedWidth: Story = {
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

export const Controlled: Story = { render: () => <ControlledExample /> };

const loadAssociations = async () => associations.data;
const loadTracks = async () => tracks.data;

export const LazySources: Story = {
    args: {
        config: {
            tabs: [
                {
                    id: "remote-associations",
                    label: "Associations",
                    table: {
                        id: "remote-associations",
                        title: "Associations loaded on first selection",
                        columns: associations.columns,
                        options: associations.options,
                        dataSource: { load: loadAssociations },
                    },
                },
                {
                    id: "remote-tracks",
                    label: "Annotation tracks",
                    table: {
                        id: "remote-tracks",
                        title: "Tracks loaded on first selection",
                        columns: tracks.columns,
                        options: { ...tracks.options, enableRowSelect: false },
                        dataSource: { load: loadTracks },
                    },
                },
            ],
        },
    },
};
