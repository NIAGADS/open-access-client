import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
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

export const ConnectedFolders: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const first = canvas.getByRole("tab", { name: /Associations/ });
        const second = canvas.getByRole("tab", { name: /Annotation tracks/ });
        const search = within(canvas.getByRole("tabpanel")).getByPlaceholderText("Search");
        await userEvent.type(search, "APOE");
        await userEvent.click(second);
        await expect(canvas.getByRole("heading", { name: "Genomic annotation tracks" })).toBeVisible();
        await expect(within(canvas.getByRole("tabpanel")).getByPlaceholderText("Search")).toHaveValue("");
        await userEvent.click(first);
        await expect(within(canvas.getByRole("tabpanel")).getByPlaceholderText("Search")).toHaveValue("APOE");
        await userEvent.keyboard("{End}");
        await expect(second).toHaveFocus();
        await expect(second).toHaveAttribute("aria-selected", "true");
        await userEvent.keyboard("{Home}");
        await expect(first).toHaveFocus();
        await expect(first).toHaveAttribute("aria-selected", "true");
        const panel = within(canvas.getByRole("tabpanel"));
        await userEvent.clear(panel.getByPlaceholderText("Search"));
        await userEvent.click(panel.getByRole("columnheader", { name: "p-value" }));
        await userEvent.selectOptions(panel.getByRole("combobox", { name: "Results per page" }), "20");
        await userEvent.click(within(panel.getByLabelText("pagination")).getAllByRole("button")[1]);
        await userEvent.click(panel.getByRole("button", { name: "Columns" }));
        await userEvent.click(panel.getByText("Relative Positi...", { exact: true }));
        await userEvent.click(panel.getByRole("button", { name: "Columns" }));
        const sortedPage = panel
            .getAllByRole("row")
            .slice(1)
            .map((row) => row.textContent);
        await userEvent.click(second);
        await userEvent.click(first);
        const restored = within(canvas.getByRole("tabpanel"));
        await expect(restored.getByRole("combobox", { name: "Results per page" })).toHaveValue("20");
        await expect(restored.getByText("21 - 40 of 1194")).toBeVisible();
        await expect(restored.queryByRole("columnheader", { name: "Relative Position" })).toBeNull();
        await expect(
            restored
                .getAllByRole("row")
                .slice(1)
                .map((row) => row.textContent)
        ).toEqual(sortedPage);
    },
};

export const ConstrainedWidth: Story = {
    render: (args) => (
        <div style={{ maxWidth: 420 }}>
            <TabbedTableView {...args} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Tables" }), "tracks");
        await expect(canvas.getByRole("heading", { name: "Genomic annotation tracks" })).toBeVisible();
    },
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

const loadAssociations = fn(async () => associations.data);
const loadTracks = fn(async () => tracks.data);

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
    beforeEach: () => {
        loadAssociations.mockClear();
        loadTracks.mockClear();
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByRole("table");
        await expect(loadAssociations).toHaveBeenCalledTimes(1);
        await expect(loadTracks).not.toHaveBeenCalled();
        const search = within(canvas.getByRole("tabpanel")).getByPlaceholderText("Search");
        await userEvent.type(search, "APOE");
        await userEvent.click(canvas.getByRole("tab", { name: "Annotation tracks" }));
        await waitFor(() => expect(loadTracks).toHaveBeenCalledTimes(1));
        await canvas.findByRole("table");
        await userEvent.click(canvas.getByRole("tab", { name: "Associations" }));
        await expect(within(canvas.getByRole("tabpanel")).getByPlaceholderText("Search")).toHaveValue("APOE");
        await expect(loadAssociations).toHaveBeenCalledTimes(1);
        await userEvent.click(canvas.getByRole("tab", { name: "Annotation tracks" }));
        await expect(loadTracks).toHaveBeenCalledTimes(1);
    },
};
