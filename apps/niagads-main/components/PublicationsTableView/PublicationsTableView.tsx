"use client";

import { TabbedTableView, type TabbedTableConfig } from "@niagads/table";
import { TableColumn, type TableViewConfig } from "@niagads/table";
import styles from "./publications-table.module.css";

export interface LinkEntry {
    value?: string;
    url: string;
    displayText?: string;
}

export interface Publication {
    title: string;
    authors: string[];
    journal: string;
    year: number;
    publicationType: string;
    pmid: LinkEntry;
    doi: LinkEntry | null;
    pmcid: LinkEntry | null;
    keywords: LinkEntry[] | null;
    grants: string[] | null;
    // is_niagads: boolean;
}

const columns: TableColumn[] = [
    { id: "pmid", header: "PubMed ID", type: "link", disableColumnFilter: true },
    {
        id: "year",
        header: "Year",
        type: "integer",
        disableColumnFilter: true,
        filterOpts: {},
    },
    {
        id: "title",
        header: "Title",
        required: true,
        disableColumnFilter: true,
        filterOpts: { isTopic: false },
    },
    {
        id: "journal",
        header: "Journal",
        styling: { getClassName: () => styles["journal-name"] },
        disableColumnFilter: true,
    },
    { id: "authors", header: "Authors", type: "text", disableColumnFilter: true },

    {
        id: "publicationType",
        header: "Publication type",
        disableColumnFilter: true,
    },
    { id: "doi", header: "DOI", type: "link", disableColumnFilter: true },
    { id: "pmcid", header: "PMC ID", type: "link", disableColumnFilter: true },
    {
        id: "keywords",
        header: "MeSH Topics",
        description:
            "Medical subject headings (MeSH) mapping each article to its primary biomedical topics, clinical conditions, and specific health concepts.",
        disableColumnFilter: true,
        type: "link",
        filterOpts: { isTopic: true, filterType: "select" },
    },
    { id: "grants", header: "Grants", type: "text", disableColumnFilter: true },
];

export const getPublicationsTableConfig = (id: string, title: string, url: string): TableViewConfig => ({
    id,
    title,
    columns,
    dataSource: { type: "endpoint", url },
    options: {
        enableColumnFilters: true,
        enableExport: true,
        enableTopicFilter: true,
        defaultColumns: ["pmid", "year", "title", "journal", "authors"],
        filterGroupOrder: ["Publication"],
    },
});

export interface PublicationCollection {
    id: string;
    name: string;
}

interface PublicationsTabsProps {
    collections: PublicationCollection[];
}

const collectionUrl = (collectionId: string) => `/api/publications/${encodeURIComponent(collectionId)}`;

export const PublicationsTableView = ({ collections }: PublicationsTabsProps) => {
    const config: TabbedTableConfig = {
        tabs: collections.map((collection) => ({
            id: collection.id,
            label: collection.name,
            table: getPublicationsTableConfig(
                `niagads-publications-${collection.id}`,
                collection.name,
                collectionUrl(collection.id)
            ),
        })),
    };

    return <TabbedTableView config={config} label="Publication collections" />;
};
