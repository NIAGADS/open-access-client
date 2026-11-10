"use client";

import Table from "@niagads/table";
import { TableColumn } from "@niagads/table";
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
    abstract: string | null;
    pmid: LinkEntry;
    doi: LinkEntry | null;
    pmcid: LinkEntry | null;
    keywords: LinkEntry[];
    grants: string[] | null;
    // is_niagads: boolean;
}

const columns: TableColumn[] = [
    { id: "pmid", header: "PubMed ID", type: "link", disableColumnFilter: true },
    {
        id: "year",
        header: "Year",
        type: "integer",
        filterOpts: {},
    },
    {
        id: "title",
        header: "Title",
        required: true,
        disableColumnFilter: true,
        filterOpts: { isTopic: true },
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
    { id: "abstract", header: "Abstract", disableColumnFilter: true, filterOpts: { isTopic: true } },

    { id: "doi", header: "DOI", type: "link", disableColumnFilter: true },
    { id: "pmcid", header: "PMC ID", type: "link", disableColumnFilter: true },
    {
        id: "keywords",
        header: "Concepts",
        description:
            "Medical subject headings (MeSH) mapping each article to its primary biomedical topics, clinical conditions, and specific health concepts.",
        disableColumnFilter: true,
        type: "link",
        filterOpts: { isTopic: true },
    },
    { id: "grants", header: "Grants", type: "text", disableColumnFilter: true },
];

interface PublicationsTableProps {
    id?: string;
    data: Publication[];
}

export const PublicationsTable = ({ data, id = "niagads-publications" }: PublicationsTableProps) => (
    <div className={styles["publications-table"]}>
        <Table
            id={id}
            columns={columns}
            data={data as any}
            options={{
                enableColumnFilters: false,
                enableExport: true,
                enableTopicFilter: true,
                defaultColumns: ["pmid", "year", "title", "journal", "authors"],
                filterGroupOrder: ["Publication"],
            }}
        />
    </div>
);
