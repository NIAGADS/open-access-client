import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TabHeader, TabBody, Tabs, Tab } from "@niagads/ui/client";

const meta: Meta<typeof Tabs> = {
    title: "UI/Client/Tabs",
    component: Tabs,
    parameters: {},
    tags: ["autodocs"],
    argTypes: {
        variant: { control: "radio", options: ["default", "integrated"] },
        label: { control: "text", description: "Accessible name for tab navigation and the responsive dropdown" },
        children: { control: false, description: "Tab components" },
    },
    args: {
        variant: "default",
        children: [
            <Tab key="tab1" id="tab1">
                <TabHeader>Tab 1</TabHeader>
                <TabBody>This is tab 1</TabBody>
            </Tab>,
            <Tab key="tab2" id="tab2">
                <TabHeader>Tab 2</TabHeader>
                <TabBody>This is tab 2</TabBody>
            </Tab>,
            <Tab key="tab3" id="tab3">
                <TabHeader>Tab 3</TabHeader>
                <TabBody>This is tab 3</TabBody>
            </Tab>,
        ],
    },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Playground: Story = { name: "Default" };

export const Integrated: Story = { args: { variant: "integrated" } };

export const MobileResponsiveView: Story = {
    name: "Mobile Responsive View",
    render: (args) => (
        <div style={{ maxWidth: 420 }}>
            <Tabs {...args} />
        </div>
    ),
};
