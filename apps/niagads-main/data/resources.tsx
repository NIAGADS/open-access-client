import { ADVPLogo, NIAGADSFilerLogo, NIAGADSGenomicsDBLogo, NIAGADSXQTLLogo } from "@niagads/ui";

import type { Resource } from "@/components/ResourceEcosystemViewer/ResourceEcosystemViewer";

export const RESOURCE_ECOSYSTEM_OVERVIEW = {
    title: "NIAGADS Ecosystem",
    description: `Together with partner offerings, NIAGADS provides an integrated suite of resources for discovering, exploring, and accessing Alzheimer’s 
        disease and related dementia genetics and genomics data.`,

    instruction: "Select a resource to explore its connections.",
    defaultDetail: {
        title: "Explore the ecosystem",
        description: "Select a resource to discover its genomic connections, available data, and access options.",
    },
};

export const RESOURCE_GROUPS = [
    { id: "knowledgebase", label: "NIAGADS Resources", color: "var(--accent-teal)" },
    { id: "access", label: "NIAGADS Resources", color: "var(--warning-amber)" },
    { id: "partner", label: "Partner Resources", color: "var(--text-primary)" },
];

export const RESOURCES: Resource[] = [
    {
        id: "genomicsdb",
        badge: "GDB",
        name: "Alzheimer's GenomicsDB",
        description: `The NIAGADS Alzheimer’s GenomicsDB is an interactive knowledgebase for exploring AD/ADRD genetic associations, 
            ADSP variants, and functional annotations in the context of genes, variants, and genomic regions. 
            Researchers can search, browse, and integrate GWAS and sequencing results to investigate disease-associated loci 
            and their potential functional relevance.`,
        url: "https://www.niagads.org/genomics",
        logo: <NIAGADSGenomicsDBLogo />,
        color: "#087e78",
        connectionColor: "#00b8ad",
        groupId: "knowledgebase",
        concepts: [
            "adspData",
            "genes",
            "variants",
            "gwas",
            "ld",
            "apiAccess",
            "curatedEvidence",
            "webAccess",
            "genomicAnnotations",
            "geneticAssociations",
        ],
    },
    {
        id: "xqtl",
        badge: "xQTL",
        name: "ADSP FunGen xQTL Browser",
        description: `The ADSP FunGen xQTL Browser provides access to harmonized molecular QTL and fine-mapping results 
            in AD-relevant brain tissues and cell types. Researchers can explore how genetic variation affects gene expression 
            and other molecular traits.`,
        url: "https://xqtl.niagads.org",
        logo: <NIAGADSXQTLLogo />,
        color: "#087e78",
        connectionColor: "#00b8ad",
        groupId: "knowledgebase",
        concepts: ["adspData", "qtls", "variants", "genes", "webAccess", "geneticAssociations", "downloads"],
    },
    {
        id: "filer",
        badge: "FLR",
        name: "FILER",
        url: "https://tf.lisanwanglab.org/FILER/",
        logo: <NIAGADSFilerLogo />,
        color: "#087e78",
        connectionColor: "#00b8ad",
        description: `FILER is a harmonized, searchable collection of human functional genomics data assembled from major resources including
            ENCODE, Roadmap Epigenomics, and GTEx. Researchers can identify and query functional
            genomic tracks by biological context and genomic region to investigate regulatory evidence
            and help interpret disease-associated variants and loci.`,
        groupId: "knowledgebase",
        concepts: [
            "qtls",
            "geneticAssociations",
            "regulatory",
            "downloads",
            "apiAccess",
            "webAccess",
            "genomicAnnotations",
        ],
    },

    {
        id: "advp",
        badge: "ADVP",
        name: "Alzheimer's Disease Variant Portal",
        logo: <ADVPLogo />,
        color: "#385379",
        connectionColor: "#3984e6",
        description: `The Alzheimer’s Disease Variant Portal (ADVP) is a curated, harmonized collection of published genetic associations
             for AD and related phenotypes.`,
        url: "https://advp.niagads.org",
        groupId: "partner",
        concepts: ["downloads", "gwas", "genes", "variants", "curatedEvidence", "webAccess", "geneticAssociations"],
    },
];
