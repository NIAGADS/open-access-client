import { parse, filter, type TNode } from "txml";
import type { Publication, LinkEntry } from "@/components/Publications/PublicationsTable";
import { URLS } from "@/data/url_ref";

const elements = (node: TNode | null | undefined, tag: string): TNode[] | null => {
    if (!node) return null;
    const matches = filter(node.children, (child) => child.tagName === tag);
    return matches.length ? matches : null;
};

const first = (node: TNode | null | undefined, tag: string) => elements(node, tag)?.[0] ?? null;

// Concatenate inline text without adding spaces inside words or before punctuation.
const text = (node: TNode | string | null | undefined): string | null => {
    if (node == null) return null;
    return typeof node === "string" ? node : node.children.map(text).join("") || null;
};

const content = (node: TNode | null | undefined) => text(node)?.replace(/\s+/g, " ").trim() || null;

const parsePubMedArticle = (xml: TNode, grantsByPmid: Map<string, string | null>): Publication | null => {
    const citation = first(xml, "MedlineCitation");
    const pmid = content(first(citation, "PMID"));
    const article = first(citation, "Article");
    if (!pmid || !article) return null;

    const publicationType = first(article, "PublicationType");
    const ids = elements(first(xml, "PubmedData"), "ArticleId");
    const journal = first(article, "ISOAbbreviation");
    const title = content(first(article, "ArticleTitle"));

    // year
    const journalIssue = first(first(article, "Journal"), "JournalIssue");
    const pubDate = first(journalIssue, "PubDate");
    const year = (content(first(pubDate, "Year")) || content(first(pubDate, "MedlineDate")))?.match(/\d{4}/)?.[0];

    // authors
    const authors: string[] = [];
    for (const author of elements(article, "Author") ?? []) {
        let name = content(first(author, "CollectiveName"));
        if (!name) {
            const foreName = content(first(author, "ForeName"));
            const lastName = content(first(author, "LastName"));
            name = foreName && lastName ? `${foreName} ${lastName}` : foreName || lastName;
        }
        if (name) authors.push(name);
    }

    // abstract
    const abstract: string[] = [];
    for (const section of elements(article, "AbstractText") ?? []) {
        const value = content(section);
        if (value) {
            const label = section.attributes.Label || section.attributes.NlmCategory;
            abstract.push(label ? `${label}: ${value}` : value);
        }
    }

    // keywords
    const keywords: LinkEntry[] = [];
    for (const heading of elements(citation, "MeshHeading") ?? []) {
        const descriptor = first(heading, "DescriptorName");
        const value = content(descriptor);
        // const majorTopic = descriptor?.attributes.MajorTopicYN;
        const curie = descriptor?.attributes.UI!;
        //if (value && majorTopic)
        if (value)
            keywords.push({ value: value, url: `${URLS.MESH}/${curie}`, displayText: `${value} [MeSH:${curie}]` });
    }

    const doi = content(ids?.find((id) => id.attributes.IdType?.toLowerCase() === "doi"));
    const pmcid = content(ids?.find((id) => id.attributes.IdType?.toLowerCase() === "pmc"));

    return {
        pmid: { value: `PMID:${pmid}`, displayText: pmid, url: `${URLS.PUBMED}/${pmid}` },
        authors: authors,
        title: title!,
        abstract: abstract.join(" ") || null,
        doi: (doi && { url: doi }) || null,
        journal: content(journal)!,
        publicationType: content(publicationType)!,
        year: Number(year),
        pmcid: (pmcid && { value: pmcid, url: `${URLS.PMC}/${pmcid}` }) || null,
        keywords: keywords,
        grants: grantsByPmid.get(pmid)?.split(",") ?? null,
    };
};

export function parsePubMedPublications(xml: string, grantsByPmid: Map<string, string | null>): Publication[] {
    const document = parse(xml, {
        decodeEntities: true,
        keepWhitespace: true,
        skipXmlDeclaration: true,
        selfClosingTags: [],
    });
    const publications: Publication[] = [];
    for (const article of filter(document, (node) => node.tagName === "PubmedArticle")) {
        const row = parsePubMedArticle(article, grantsByPmid);
        if (row) publications.push(row);
    }
    return publications;
}
