import { ArrowRight, Database, Layers3, LockKeyhole, SquareCode } from "lucide-react";

import { URLS } from "@/data/url_ref";
import styles from "./data-access-options.module.css";

export function DataAccessOptions() {
    return (
        <section className={styles["data-access-options"]} aria-label="Data access options">
            <div className={styles.intro}>
                <h2>Access NIAGADS Data</h2>
                <p>
                    NIAGADS offers complementary resources for controlled-access data sharing, genomic data exploration,
                    and programmatic access to AD/ADRD genomic knowledge.
                </p>
            </div>
            <div className={styles.cards}>
                <a
                    className={`${styles.card} ${styles.dss}`}
                    href={URLS.DATA_SHARING_SERVICE}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <span className={styles.icon} aria-hidden="true">
                        <Database />
                        <LockKeyhole className={styles.lock} />
                    </span>
                    <span className={styles["card-text"]}>
                        <strong>Data Sharing Service</strong>
                        <span className={styles.description}>
                            Browse and request access to controlled-access genomic, multi-omics, and associated
                            phenotypic data, including data from the Alzheimer’s Disease Sequencing Project (ADSP).
                        </span>
                        <span className={styles.action}>
                            Explore DSS <ArrowRight aria-hidden="true" />
                        </span>
                    </span>
                </a>
                <a
                    className={`${styles.card} ${styles.api}`}
                    href={URLS.OPEN_ACCESS_API}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <span className={styles.icon} aria-hidden="true">
                        <SquareCode />
                    </span>
                    <span className={styles["card-text"]}>
                        <strong>Open Access API</strong>
                        <span className={styles.description}>
                            Programmatically explore AD/ADRD genetic evidence, retrieve annotated ADSP variants and
                            curated or genome-wide genetic associations, and access functional annotations for variants,
                            genomic regions, and genes.
                        </span>
                        <span className={styles.action}>
                            Explore API <ArrowRight aria-hidden="true" />
                        </span>
                    </span>
                </a>
                <a className={`${styles.card} ${styles["open-access"]}`} href="#open-access-resources">
                    <span className={styles.icon} aria-hidden="true">
                        <Layers3 />
                    </span>
                    <span className={styles["card-text"]}>
                        <strong>Open Access Knowledgebases</strong>
                        <span className={styles.description}>
                            Explore NIAGADS and partner genomic knowledgebases to support discovery and interpretation
                            of genetic findings in AD/ADRD research.
                        </span>
                        <span className={styles.action}>
                            Explore resources <ArrowRight aria-hidden="true" />
                        </span>
                    </span>
                </a>
            </div>
        </section>
    );
}
