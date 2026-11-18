# Tabs

`Tabs`, `Tab`, `TabHeader` and `TabBody` are exported from `@niagads/ui/client`. They own generic navigation, selection and panel visibility; consumers own panel content and data retrieval. `TabbedTableView` is one consumer and uses the `integrated` variant.

```tsx
<Tabs defaultTab="overview" variant="integrated" label="Record sections">
    <Tab id="overview">
        <TabHeader>Overview</TabHeader>
        <TabBody>Record overview</TabBody>
    </Tab>
    <Tab id="details">
        <TabHeader>Details</TabHeader>
        <TabBody>Record details</TabBody>
    </Tab>
</Tabs>
```

## Shared behavior

Every variant provides the same responsive and accessible navigation. An optional `label` supplies a visible selector caption and names the controls; without it, the accessible name is “Tabs” and no caption is shown:

- At container widths of 40rem or less, a labeled native dropdown replaces the buttons automatically. It is not an opt-in feature and uses the same selection state.
- Left/Right arrows wrap through the tabs; Home/End move to the first/last tab. These keys move focus and activate the destination. Enter/Space use the button's native activation. Only the selected tab is in the tab sequence.
- Each instance generates unique tab and panel IDs. Buttons reference their own panels, panels reference their labels, and the dropdown references the active panel. Tab IDs can be reused in separate Tabs instances.
- Panels remain mounted while hidden so their content keeps local state. Mounting expensive content lazily is a consumer concern; Tabs does not fetch data or decide fetch timing.

`TabHeader` accepts rich content such as counts. For custom headers without textual children, supply `Tab.label` as a plain-text alternative for the responsive dropdown and button's accessible name.

## Variants

- `default`: separate tab navigation and Card-style content, with regular panel padding.
- `integrated`: the active tab joins the surrounding panel border. Panel padding is zero so content components can own their minimal spacing. Navigation behavior is unchanged.

## Selection ownership

For local state, omit `selectedTab`. `defaultTab` sets the initial selection; otherwise the first tab is selected. `onTabChange` can observe selections. If the selected tab is removed, the first remaining tab is selected.

For application-owned state, pass `selectedTab` and update it in `onTabChange`:

```tsx
<Tabs selectedTab={activeTab} onTabChange={setActiveTab}>
    {/* Tab children */}
</Tabs>
```

Controlled mode does not independently change selection or copy the controlled value into local state. The caller owns routing, browser history or other application logic. Keep a mounted instance in the same ownership mode. Tab IDs must be unique and nonempty within an instance, and configured selections must match an existing tab.
