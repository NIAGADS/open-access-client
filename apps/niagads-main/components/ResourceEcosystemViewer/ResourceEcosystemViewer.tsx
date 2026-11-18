"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Card, CardBody, NIAGADSLogo } from "@niagads/ui";
import { Layers, ChartScatter, CodeXml, Globe } from "lucide-react";
import styles from "./resource-ecosystem.module.css";

export type ConceptType =
    | "genes"
    | "variants"
    | "gwas"
    | "ld"
    | "qtls"
    | "regulatory"
    | "curatedEvidence"
    | "adspData"
    | "genomicAnnotations"
    | "geneticAssociations"
    | "downloads"
    | "apiAccess"
    | "webAccess";

interface Concept {
    id: ConceptType;
    label: string;
}

type GenomicConceptId = Extract<ConceptType, "genes" | "variants" | "gwas" | "ld" | "qtls" | "regulatory">;
type AccessConceptId = Exclude<ConceptType, GenomicConceptId>;

interface GenomicBandLayout {
    id: GenomicConceptId;
    x: number;
    y: number;
    labelDx: number;
    labelDy: number;
    connectorDx: number;
    connectorDy: number;
}

interface AccessLayout {
    id: AccessConceptId;
    x: number;
    y: number;
    connectorY: number;
    labelX: number;
    labelY: number;
}

export interface ResourceGroup {
    id: string;
    label: string;
    color: string;
}
export type ResourceLogo = ReactNode;

export interface Resource {
    id: string;
    badge: string;
    name: string;
    description: string;
    url?: string;
    logo?: ResourceLogo;
    color: string;
    connectionColor: string;
    groupId: string;
    concepts: ConceptType[];
}

export interface ResourceEcosystemOverview {
    title: string;
    description: string;
    instruction: string;
    defaultDetail: {
        title: string;
        description: string;
    };
}

interface ResourceEcosystemViewerProps {
    overview: ResourceEcosystemOverview;
    resources: Resource[];
    resourceGroups: ResourceGroup[];
}

interface ResourceGroupLabel {
    label: string;
    start: number;
    span: number;
}

type ActiveTarget = { type: "resource"; id: string } | { type: "concept"; id: ConceptType } | null;

const CONCEPTS: Concept[] = [
    { id: "genes", label: "Genes" },
    { id: "variants", label: "Variants" },
    { id: "gwas", label: "GWAS associations" },
    { id: "ld", label: "LD" },
    { id: "qtls", label: "Molecular QTLs" },
    { id: "regulatory", label: "Regulatory elements" },
    { id: "curatedEvidence", label: "Curated evidence" },
    { id: "adspData", label: "ADSP Data" },
    { id: "genomicAnnotations", label: "Genomic Annotations" },
    { id: "geneticAssociations", label: "Genetic Associations" },
    { id: "downloads", label: "Downloads" },
    { id: "apiAccess", label: "API" },
    { id: "webAccess", label: "Web" },
];

const GENOMIC_BAND_LAYOUT: GenomicBandLayout[] = [
    { id: "genes", x: 170, y: 150, labelDx: -29, labelDy: 44, connectorDx: -79, connectorDy: -30 },
    { id: "variants", x: 350, y: 150, labelDx: 0, labelDy: 26, connectorDx: 0, connectorDy: -18 },
    { id: "gwas", x: 350, y: 90, labelDx: 0, labelDy: -34, connectorDx: 0, connectorDy: -18 },
    { id: "ld", x: 350, y: 210, labelDx: 0, labelDy: 54, connectorDx: 0, connectorDy: -18 },
    { id: "qtls", x: 910, y: 168, labelDx: 30, labelDy: 78, connectorDx: 0, connectorDy: -36 },
    { id: "regulatory", x: 630, y: 150, labelDx: 0, labelDy: 44, connectorDx: 0, connectorDy: -18 },
];

const ACCESS_LAYOUT: AccessLayout[] = [
    { id: "curatedEvidence", x: 150, y: 300, connectorY: 292, labelX: 107, labelY: 305 },
    { id: "adspData", x: 300, y: 300, connectorY: 292, labelX: 277, labelY: 305 },
    { id: "genomicAnnotations", x: 460, y: 300, connectorY: 292, labelX: 407, labelY: 305 },
    { id: "geneticAssociations", x: 650, y: 300, connectorY: 292, labelX: 597, labelY: 305 },
    { id: "webAccess", x: 925, y: 300, connectorY: 292, labelX: 922, labelY: 305 },
    { id: "apiAccess", x: 1013, y: 300, connectorY: 292, labelX: 1017, labelY: 305 },
    { id: "downloads", x: 1125, y: 300, connectorY: 292, labelX: 1107, labelY: 305 },
];

const LANDSCAPE_WIDTH = 1240;

const genomicLayoutById = Object.fromEntries(GENOMIC_BAND_LAYOUT.map((layout) => [layout.id, layout])) as Record<
    GenomicConceptId,
    GenomicBandLayout
>;

const accessLayoutById = Object.fromEntries(ACCESS_LAYOUT.map((layout) => [layout.id, layout])) as Record<
    AccessConceptId,
    AccessLayout
>;

function getConnectorGeometry(conceptId: ConceptType) {
    if (conceptId in genomicLayoutById) {
        const layout = genomicLayoutById[conceptId as GenomicConceptId];

        return {
            anchorY: layout.y,
            x: layout.x + layout.connectorDx,
            y: layout.y + layout.connectorDy,
        };
    }

    const layout = accessLayoutById[conceptId as AccessConceptId];

    return { anchorY: layout.y, x: layout.x, y: layout.connectorY };
}

function getFallbackResourceCenterX(index: number, resourceCount: number) {
    return ((index + 0.5) / resourceCount) * LANDSCAPE_WIDTH;
}

const GENE_EXONS: Array<[number, number]> = [
    [68, 46],
    [168, 58],
    [608, 80],
    [728, 48],
    [1002, 26],
    [1100, 52],
];

// Deterministic schematic Manhattan profile; these are not measured association values.
const ASSOCIATION_POINT_Y = [
    118, 114, 122, 110, 116, 104, 120, 112, 98, 88, 76, 92, 108, 119, 114, 102, 97, 84, 68, 90, 105, 118, 111, 95, 80,
    99, 116, 121, 109,
] as const;

// Schematic values provide the familiar LD heatmap structure without implying measured data.
const LD_VALUES = [
    [3, 2, 1, 3, 2, 0, 2],
    [3, 1, 2, 0, 2, 3],
    [3, 2, 1, 1, 3],
    [2, 3, 2, 0],
    [1, 2, 3],
    [2, 1],
    [3],
] as const;

const LD_COLORS = ["var(--gray-100)", "var(--gray-300)", "var(--secondary-blue)", "var(--primary-blue)"] as const;
const ACTIVE_LD_COLORS = [
    "var(--gray-100)",
    "color-mix(in srgb, var(--active-feature-color) 25%, white)",
    "color-mix(in srgb, var(--active-feature-color) 60%, white)",
    "var(--active-feature-color)",
] as const;

const conceptById = Object.fromEntries(CONCEPTS.map((concept) => [concept.id, concept])) as Record<
    ConceptType,
    (typeof CONCEPTS)[number]
>;

export function ResourceEcosystemViewer({ overview, resources, resourceGroups }: ResourceEcosystemViewerProps) {
    // Hovering or focusing a resource selects it persistently; taps/clicks also select it.
    // Concept highlights remain temporary.
    const [hovered, setHovered] = useState<ActiveTarget>(null);
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
    const active = useMemo<ActiveTarget>(
        () => (selectedResourceId ? { type: "resource", id: selectedResourceId } : hovered),
        [selectedResourceId, hovered]
    );
    const [resourceCenterX, setResourceCenterX] = useState<Record<string, number>>({});
    const shellRef = useRef<HTMLElement>(null);
    const resourceRowRef = useRef<HTMLDivElement>(null);
    const resourceGridStyle = { "--resource-count": resources.length } as CSSProperties;
    const resourceById = useMemo(
        () => Object.fromEntries(resources.map((resource) => [resource.id, resource])) as Record<string, Resource>,
        [resources]
    );
    const resourceGroupById = useMemo(
        () => Object.fromEntries(resourceGroups.map((group) => [group.id, group])) as Record<string, ResourceGroup>,
        [resourceGroups]
    );
    const resourceGroupLabels = useMemo(
        () =>
            resources.reduce<ResourceGroupLabel[]>((labels, resource, index) => {
                const label = resourceGroupById[resource.groupId].label;
                const previous = labels.at(-1);

                // FIXME: Groups sharing a label are merged only when their resources are adjacent in user-defined order.
                if (previous?.label === label) {
                    previous.span += 1;
                } else {
                    labels.push({ label, start: index + 1, span: 1 });
                }

                return labels;
            }, []),
        [resourceGroupById, resources]
    );

    useEffect(() => {
        const resourceRow = resourceRowRef.current;

        if (!resourceRow) {
            return;
        }

        const measureResourceCenters = () => {
            const rowBounds = resourceRow.getBoundingClientRect();

            if (rowBounds.width === 0) {
                return;
            }

            const centers: Record<string, number> = {};

            resourceRow.querySelectorAll<HTMLElement>("[data-resource-id]").forEach((resourceElement) => {
                const resourceId = resourceElement.dataset.resourceId;

                if (resourceId) {
                    const resourceBounds = resourceElement.getBoundingClientRect();
                    const centerInRow = resourceBounds.left + resourceBounds.width / 2 - rowBounds.left;
                    centers[resourceId] = (centerInRow / rowBounds.width) * LANDSCAPE_WIDTH;
                }
            });

            setResourceCenterX(centers);
        };

        measureResourceCenters();

        const resizeObserver = new ResizeObserver(measureResourceCenters);
        resizeObserver.observe(resourceRow);
        resourceRow.querySelectorAll<HTMLElement>("[data-resource-id]").forEach((resourceElement) => {
            resizeObserver.observe(resourceElement);
        });

        return () => resizeObserver.disconnect();
    }, [resources]);

    const conceptToResources = useMemo(() => {
        return Object.fromEntries(
            CONCEPTS.map((concept) => [
                concept.id,
                resources.filter((resource) => resource.concepts.includes(concept.id)).map((resource) => resource.id),
            ])
        ) as Record<ConceptType, string[]>;
    }, [resources]);

    const activeConcepts = useMemo(() => {
        if (!active) {
            return new Set<ConceptType>();
        }

        if (active.type === "resource") {
            return new Set(resourceById[active.id].concepts);
        }

        return new Set<ConceptType>([active.id]);
    }, [active, resourceById]);

    const activeResources = useMemo(() => {
        if (!active) {
            return new Set<string>();
        }

        if (active.type === "resource") {
            return new Set<string>([active.id]);
        }

        return new Set<string>(conceptToResources[active.id]);
    }, [active, conceptToResources]);

    // Clicking anywhere outside a resource, concept, or detail card clears the selection.
    // Listen on document so a click outside the graph also dismisses a selection.
    useEffect(() => {
        const handleDocumentPointerDown = (event: PointerEvent) => {
            const target = event.target;
            const shell = shellRef.current;
            if (!(target instanceof Element) || !shell) return;

            const isInteractiveTarget =
                shell.contains(target) &&
                (target.closest("[data-resource-id]") ||
                    target.closest("[data-concept-id]") ||
                    target.closest(`.${styles["resource-detail"]}`));

            if (!isInteractiveTarget) {
                setSelectedResourceId(null);
                setHovered(null);
            }
        };

        const handleDocumentKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedResourceId(null);
                setHovered(null);
            }
        };

        document.addEventListener("pointerdown", handleDocumentPointerDown);
        document.addEventListener("keydown", handleDocumentKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handleDocumentPointerDown);
            document.removeEventListener("keydown", handleDocumentKeyDown);
        };
    }, []);

    const clearHover = (type: NonNullable<ActiveTarget>["type"], id: string) => {
        setHovered((previous) => (previous?.type === type && previous.id === id ? null : previous));
    };

    const selectResource = (id: string) => {
        setSelectedResourceId(id);
        setHovered(null);
    };

    const activateConcept = (id: ConceptType) => {
        // Concepts retain their temporary highlight, but do not lock project details.
        setSelectedResourceId(null);
        setHovered({ type: "concept", id });
    };

    // SVG groups with role="button" need keyboard activation (unlike native buttons).
    const conceptInteractions = (id: ConceptType) => ({
        "data-concept-id": id,
        onFocus: () => setHovered({ type: "concept" as const, id }),
        onBlur: () => clearHover("concept", id),
        onMouseEnter: () => setHovered({ type: "concept" as const, id }),
        onMouseLeave: () => clearHover("concept", id),
        onClick: () => activateConcept(id),
        onKeyDown: (event: React.KeyboardEvent<SVGGElement>) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activateConcept(id);
            }
        },
    });

    const detailResource = active?.type === "resource" ? resourceById[active.id] : undefined;

    const resourceLogo = detailResource?.logo ?? <NIAGADSLogo />;

    const classForConcept = (id: ConceptType) =>
        [
            styles["concept-mark"],
            active && !activeConcepts.has(id) ? styles.recede : "",
            activeConcepts.has(id) ? styles.active : "",
        ]
            .filter(Boolean)
            .join(" ");

    const classForResource = (id: string, index: number) => {
        const resource = resourceById[id];
        const startsGroup = index > 0 && resources[index - 1].groupId !== resource.groupId;

        return [
            styles.resource,
            startsGroup ? styles["group-start"] : "",
            active && !activeResources.has(id) ? styles.recede : "",
            activeResources.has(id) ? styles.active : "",
        ]
            .filter(Boolean)
            .join(" ");
    };

    const pathClass = (resourceId: string, conceptId: ConceptType) =>
        [
            styles.link,
            active && !(activeResources.has(resourceId) && activeConcepts.has(conceptId)) ? styles.recede : "",
            activeResources.has(resourceId) && activeConcepts.has(conceptId) ? styles.active : "",
        ]
            .filter(Boolean)
            .join(" ");

    return (
        <main className={styles.shell} ref={shellRef}>
            <section className={styles.ecosystem} aria-label="NIAGADS homepage resource visualization prototype">
                <div className={styles["ecosystem-intro"]}>
                    <h2>{overview.title}</h2>
                    <p>{overview.description}</p>
                    <p className={styles["ecosystem-instruction"]}>{overview.instruction}</p>
                </div>

                <div className={styles["resource-group-labels"]} aria-hidden="true" style={resourceGridStyle}>
                    {resourceGroupLabels.map((groupLabel) => (
                        <span
                            className={`${styles["group-label"]} ${groupLabel.start > 1 ? styles["group-start"] : ""}`}
                            key={`${groupLabel.label}-${groupLabel.start}`}
                            style={{ gridColumn: `${groupLabel.start} / span ${groupLabel.span}` }}
                        >
                            {groupLabel.label}
                        </span>
                    ))}
                </div>
                <div
                    className={styles["resource-row"]}
                    aria-label="Resources"
                    ref={resourceRowRef}
                    style={resourceGridStyle}
                >
                    {resources.map((resource, resourceIndex) => (
                        <button
                            className={classForResource(resource.id, resourceIndex)}
                            aria-label={resource.name}
                            data-resource-id={resource.id}
                            key={resource.id}
                            style={
                                {
                                    "--resource-color": resource.color,
                                    // Other project buttons must remain clickable while one is selected.
                                    pointerEvents: "auto",
                                } as CSSProperties
                            }
                            type="button"
                            aria-pressed={selectedResourceId === resource.id}
                            onFocus={() => selectResource(resource.id)}
                            onMouseEnter={() => selectResource(resource.id)}
                            onClick={() => selectResource(resource.id)}
                        >
                            <span className={styles.badge}>{resource.name}</span>
                        </button>
                    ))}
                </div>

                <svg
                    className={styles.landscape}
                    viewBox={`0 0 ${LANDSCAPE_WIDTH} 340`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-labelledby="ecosystem-title ecosystem-desc"
                >
                    <title id="ecosystem-title">NIAGADS resource ecosystem concept landscape</title>
                    <desc id="ecosystem-desc">
                        Resources connect to a core genomic landscape plus peripheral context, evidence, download, and
                        programmatic access zones. Hover or focus a resource or concept to highlight relevant
                        connections.
                    </desc>

                    <defs>
                        <pattern id="regulatoryEnhancerPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                            <rect width="6" height="6" fill="var(--gray-100)" />
                            <path
                                d="M-1 1 L1 -1 M0 6 L6 0 M5 7 L7 5"
                                stroke={
                                    activeConcepts.has("regulatory") ? "var(--active-feature-color)" : "var(--gray-500)"
                                }
                                strokeWidth="1"
                            />
                        </pattern>
                        <pattern id="regulatoryPromoterPattern" width="5" height="5" patternUnits="userSpaceOnUse">
                            <rect width="5" height="5" fill="var(--gray-100)" />
                            <path
                                d="M2.5 0 V5"
                                stroke={
                                    activeConcepts.has("regulatory") ? "var(--active-feature-color)" : "var(--gray-500)"
                                }
                                strokeWidth="1"
                            />
                        </pattern>
                        <pattern id="regulatorySilencerPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                            <rect width="6" height="6" fill="var(--gray-100)" />
                            <path
                                d="M-1 5 L1 7 M0 0 L6 6 M5 -1 L7 1"
                                stroke={
                                    activeConcepts.has("regulatory") ? "var(--active-feature-color)" : "var(--gray-500)"
                                }
                                strokeWidth="1"
                            />
                        </pattern>
                    </defs>

                    <g className={styles["peripheral-frame"]} aria-hidden="true">
                        <path className={styles["utility-rule"]} d="M0 278 H1240" />
                        <text className={styles["zone-label"]} x="0" y="305">
                            Context
                        </text>
                        <path className={styles["utility-divider"]} d="M760 286 V316" />
                        <text className={styles["zone-label"]} x="780" y="305">
                            Access
                        </text>
                    </g>

                    <g className={styles["context-layer"]}>
                        <path
                            className={styles["soft-contour"]}
                            d="M0 126 C235 76 392 95 530 132 S799 185 950 132 1138 100 1240 146"
                        />
                        <path
                            className={styles["soft-contour"]}
                            d="M0 265 C274 216 410 254 556 242 S785 204 910 249 1082 286 1240 244"
                        />
                        <line className={styles["resource-rail"]} x1="0" x2="1240" y1="32" y2="32" />
                    </g>

                    <line className={styles["gene-track-hit"]} x1="0" x2="1240" y1="150" y2="150" />
                    <line className={styles["genome-rail"]} x1="0" x2="1240" y1="150" y2="150" />

                    <g
                        className={classForConcept("gwas")}
                        tabIndex={0}
                        role="button"
                        aria-label="Genetic associations, shown as a schematic Manhattan plot"
                        {...conceptInteractions("gwas")}
                    >
                        <rect fill="none" pointerEvents="all" x="290" y="42" width="120" height="90" rx="6" />
                        <path className={styles["association-baseline"]} d="M301 128 H399" />
                        <path className={styles["association-threshold"]} d="M301 96 H399" />
                        {ASSOCIATION_POINT_Y.map((y, index) => (
                            <circle
                                className={`${styles["association-point"]} ${y < 96 ? styles["association-point-significant"] : ""}`}
                                cx={301 + index * 3.5}
                                cy={y}
                                r={y < 96 ? 2.2 : 1.7}
                                key={index}
                            />
                        ))}
                        <GenomicLabel conceptId="gwas" />
                    </g>

                    <g
                        className={classForConcept("genes")}
                        tabIndex={0}
                        role="button"
                        aria-label="Genes"
                        {...conceptInteractions("genes")}
                    >
                        <rect
                            className={styles["gene-concept-hit-area"]}
                            x="50"
                            y="118"
                            width="180"
                            height="84"
                            rx="6"
                        />
                        {GENE_EXONS.map(([x, width]) => (
                            <rect className={styles["gene-exon"]} x={x} y="142" width={width} height="16" key={x} />
                        ))}
                        <path className={styles["gene-direction"]} d="M76 142 V132 H96 M91 128 L96 132 L91 136" />
                        <GenomicLabel conceptId="genes" />
                    </g>

                    <g
                        className={classForConcept("variants")}
                        tabIndex={0}
                        role="button"
                        aria-label="Variants"
                        {...conceptInteractions("variants")}
                    >
                        <rect className={styles["variant-hit-area"]} x="292" y="134" width="116" height="48" rx="5" />
                        {[308, 322, 336, 350, 364, 378, 392].map((x) => (
                            <path className={styles.variant} d={`M ${x} 145 l 5 5 l -5 5 l -5 -5 Z`} key={x} />
                        ))}
                        <GenomicLabel conceptId="variants" />
                    </g>

                    <g
                        className={classForConcept("ld")}
                        tabIndex={0}
                        role="button"
                        aria-label="Linkage disequilibrium, shown as a schematic triangular pairwise matrix"
                        {...conceptInteractions("ld")}
                    >
                        <rect className={styles["ld-hit-area"]} x="290" y="180" width="120" height="90" rx="6" />
                        <path className={styles["ld-top-rule"]} d="M301 190 H399" />
                        {LD_VALUES[0].map((_, index) => (
                            <path
                                className={styles["ld-tick"]}
                                d={`M ${308 + index * 14} 182 V190`}
                                key={`tick-${index}`}
                            />
                        ))}
                        {LD_VALUES.map((row, rowIndex) =>
                            row.map((value, columnIndex) => {
                                const cx = 308 + rowIndex * 7 + columnIndex * 14;
                                const cy = 197 + rowIndex * 7;

                                return (
                                    <path
                                        className={styles["ld-cell"]}
                                        d={`M ${cx} ${cy - 7} L ${cx + 7} ${cy} L ${cx} ${cy + 7} L ${cx - 7} ${cy} Z`}
                                        fill={activeConcepts.has("ld") ? ACTIVE_LD_COLORS[value] : LD_COLORS[value]}
                                        key={`${rowIndex}-${columnIndex}`}
                                    />
                                );
                            })
                        )}
                        <GenomicLabel conceptId="ld" />
                    </g>

                    <g
                        className={classForConcept("qtls")}
                        tabIndex={0}
                        role="button"
                        aria-label="Molecular QTLs, shown as multiple relationships from a variant to genomic targets"
                        {...conceptInteractions("qtls")}
                    >
                        <rect className={styles["qtl-hit-area"]} x="784" y="108" width="310" height="146" rx="6" />
                        <path className={styles["qtl-bridge"]} d="M910 150 C898 122 872 122 860 150" />
                        <path className={styles["qtl-bridge"]} d="M910 150 C885 205 832 205 800 158" />
                        <path className={styles["qtl-bridge"]} d="M910 150 C935 196 990 196 1015 158" />
                        <path className={styles["qtl-bridge"]} d="M910 150 C950 222 1040 222 1080 150" />
                        <path className={styles.variant} d="M910 144 l6 6 l-6 6 l-6 -6 Z" />
                        <GenomicLabel conceptId="qtls" />
                    </g>

                    <g
                        className={classForConcept("regulatory")}
                        tabIndex={0}
                        role="button"
                        aria-label="Regulatory elements"
                        {...conceptInteractions("regulatory")}
                    >
                        <rect
                            className={styles["regulatory-hit-area"]}
                            x="504"
                            y="104"
                            width="250"
                            height="94"
                            rx="6"
                        />
                        <path className={styles["regulatory-loop"]} d="M536 142 C546 110 588 110 598 140" />
                        <rect className={styles["regulatory-enhancer"]} x="520" y="142" width="32" height="16" rx="2" />
                        <rect className={styles["regulatory-promoter"]} x="590" y="140" width="16" height="20" rx="2" />
                        <rect className={styles["regulatory-silencer"]} x="710" y="143" width="28" height="14" rx="2" />
                        <text className={styles["regulatory-micro-label"]} x="536" y="136" textAnchor="middle">
                            Enhancer
                        </text>
                        <text className={styles["regulatory-micro-label"]} x="598" y="174" textAnchor="middle">
                            Promoter
                        </text>
                        <text className={styles["regulatory-micro-label"]} x="648" y="136" textAnchor="middle">
                            Gene
                        </text>
                        <text className={styles["regulatory-micro-label"]} x="724" y="136" textAnchor="middle">
                            Silencer
                        </text>
                        <GenomicLabel conceptId="regulatory" />
                    </g>

                    <g
                        className={classForConcept("curatedEvidence")}
                        tabIndex={0}
                        role="button"
                        aria-label="Curated evidence"
                        {...conceptInteractions("curatedEvidence")}
                    >
                        <rect className={styles["utility-hit-area"]} x="75" y="282" width="150" height="40" rx="6" />
                        <UtilityGlyph kind="evidence" x={75} y={288} />
                        <UtilityLabel conceptId="curatedEvidence" />
                    </g>

                    <g
                        className={classForConcept("adspData")}
                        tabIndex={0}
                        role="button"
                        aria-label="ADSP Data"
                        {...conceptInteractions("adspData")}
                    >
                        <rect className={styles["utility-hit-area"]} x="245" y="282" width="110" height="40" rx="6" />
                        <UtilityGlyph kind="dna" x={245} y={288} />
                        <UtilityLabel conceptId="adspData" />
                    </g>

                    <g
                        className={classForConcept("genomicAnnotations")}
                        tabIndex={0}
                        role="button"
                        aria-label="Genomic Annotations"
                        {...conceptInteractions("genomicAnnotations")}
                    >
                        <rect className={styles["utility-hit-area"]} x="375" y="282" width="175" height="40" rx="6" />
                        <Layers
                            className={styles["utility-glyph"]}
                            x={375}
                            y={288}
                            width={24}
                            height={24}
                            aria-hidden="true"
                        />
                        <UtilityLabel conceptId="genomicAnnotations" />
                    </g>

                    <g
                        className={classForConcept("geneticAssociations")}
                        tabIndex={0}
                        role="button"
                        aria-label="Genetic Associations"
                        {...conceptInteractions("geneticAssociations")}
                    >
                        <rect className={styles["utility-hit-area"]} x="565" y="282" width="175" height="40" rx="6" />
                        <ChartScatter
                            className={styles["utility-glyph"]}
                            x={565}
                            y={288}
                            width={24}
                            height={24}
                            aria-hidden="true"
                        />
                        <UtilityLabel conceptId="geneticAssociations" />
                    </g>

                    <g
                        className={classForConcept("webAccess")}
                        tabIndex={0}
                        role="button"
                        aria-label="Web access"
                        {...conceptInteractions("webAccess")}
                    >
                        <rect className={styles["utility-hit-area"]} x="890" y="282" width="70" height="40" rx="6" />
                        <Globe
                            className={styles["utility-glyph"]}
                            x={890}
                            y={288}
                            width={24}
                            height={24}
                            aria-hidden="true"
                        />
                        <UtilityLabel conceptId="webAccess" />
                    </g>

                    <g
                        className={classForConcept("apiAccess")}
                        tabIndex={0}
                        role="button"
                        aria-label="API access"
                        {...conceptInteractions("apiAccess")}
                    >
                        <rect className={styles["utility-hit-area"]} x="985" y="282" width="60" height="40" rx="6" />
                        <CodeXml
                            className={styles["utility-glyph"]}
                            x={985}
                            y={288}
                            width={24}
                            height={24}
                            aria-hidden="true"
                        />
                        <UtilityLabel conceptId="apiAccess" />
                    </g>

                    <g
                        className={classForConcept("downloads")}
                        tabIndex={0}
                        role="button"
                        aria-label="Downloads"
                        {...conceptInteractions("downloads")}
                    >
                        <rect className={styles["utility-hit-area"]} x="1075" y="282" width="110" height="40" rx="6" />
                        <UtilityGlyph kind="download" x={1075} y={288} />
                        <UtilityLabel conceptId="downloads" />
                    </g>

                    <g className={styles["link-layer"]} aria-hidden="true" pointerEvents="none">
                        {resources.flatMap((resource, resourceIndex) =>
                            resource.concepts.map((conceptId) => {
                                const start =
                                    resourceCenterX[resource.id] ??
                                    getFallbackResourceCenterX(resourceIndex, resources.length);
                                const connector = getConnectorGeometry(conceptId);
                                const bend = Math.max(62, connector.anchorY - 58);
                                const targetX = connector.x;
                                const targetY = connector.y;
                                const connectorPath = `M ${start} 42 C ${start} ${bend}, ${targetX} ${bend}, ${targetX} ${targetY}`;
                                const isActiveLink = activeResources.has(resource.id) && activeConcepts.has(conceptId);
                                return (
                                    <g key={`${resource.id}-${conceptId}`}>
                                        <path
                                            className={pathClass(resource.id, conceptId)}
                                            d={connectorPath}
                                            style={{ stroke: resource.connectionColor }}
                                        />
                                        <circle
                                            className={`${styles["link-target"]} ${isActiveLink ? styles.active : ""}`}
                                            cx={targetX}
                                            cy={targetY}
                                            r="3.5"
                                            style={{ fill: resource.connectionColor }}
                                        />
                                    </g>
                                );
                            })
                        )}
                    </g>
                </svg>

                <div className={styles["resource-detail-slot"]}>
                    <Card
                        aria-label={`${detailResource?.name ?? "NIAGADS resource ecosystem"} description`}
                        className={`${styles["resource-detail"]} ${detailResource ? "" : styles["default-detail"]}`}
                        style={
                            {
                                "--resource-color": detailResource?.color ?? "var(--primary-blue)",
                            } as CSSProperties
                        }
                    >
                        <CardBody className={styles["resource-detail-body"]}>
                            {detailResource && (
                                <div
                                    className={styles["resource-logo-container"]}
                                    role="img"
                                    aria-label={`${detailResource.name} logo`}
                                >
                                    {resourceLogo}
                                </div>
                            )}

                            <div className={styles["resource-detail-content"]}>
                                <div className={styles["resource-detail-header"]}>
                                    <h2>{detailResource?.name ?? overview.defaultDetail.title}</h2>
                                </div>

                                <p>{detailResource?.description ?? overview.defaultDetail.description}</p>
                            </div>

                            {detailResource?.url && (
                                <a
                                    className={styles["resource-detail-action"]}
                                    href={detailResource.url}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Explore resource <span aria-hidden="true">→</span>
                                </a>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </section>
        </main>
    );
}

function GenomicLabel({ conceptId }: { conceptId: GenomicConceptId }) {
    const concept = conceptById[conceptId];
    const layout = genomicLayoutById[conceptId as GenomicConceptId];

    return (
        <text
            className={styles["concept-label"]}
            x={layout.x + layout.labelDx}
            y={layout.y + layout.labelDy}
            textAnchor="middle"
        >
            {concept.label}
        </text>
    );
}

function UtilityLabel({ conceptId }: { conceptId: AccessConceptId }) {
    const concept = conceptById[conceptId];
    const layout = accessLayoutById[conceptId];

    return (
        <text className={styles["utility-label"]} x={layout.labelX} y={layout.labelY} textAnchor="start">
            {concept.label}
        </text>
    );
}

function UtilityGlyph({ kind, x, y }: { kind: "evidence" | "dna" | "download"; x: number; y: number }) {
    const glyph = {
        evidence: (
            <>
                <path d="M5 2 h9 l5 5 v6 M14 2 v5 h5 M5 2 v20 h10" />
                <circle cx="14" cy="15" r="4" />
                <path d="m17 18 l4 4" />
            </>
        ),
        dna: (
            <>
                <path d="M7 2 C19 6 19 18 7 22 M17 2 C5 6 5 18 17 22" />
                <path d="M8.5 4.5 H15.5 M10.5 8.5 H13.5 M13 12 H11 M10.5 15.5 H13.5 M8.5 19.5 H15.5" />
            </>
        ),
        download: <path d="M12 2 v13 M7 10 l5 5 l5 -5 M4 20 v2 h16 v-2" />,
    }[kind];

    return (
        <svg
            className={styles["utility-glyph"]}
            x={x}
            y={y}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            {glyph}
        </svg>
    );
}
