"use client";

import AboutIntro from "@/data/about-intro.mdx";
import AboutContent from "@/data/about.mdx";
import { AboutLayout } from "@/components/About/AboutLayout";
import { Alert } from "@niagads/ui";

export default function AboutPage() {
    return (
        <main>
            <div className="content-section content-section-centered">

                <AboutLayout
                    intro={
                        <div className="mdx-content">
                            <AboutIntro />
                        </div>
                    }
                >
                    <div className="mdx-content">
                        <AboutContent components={{ Alert }} />
                    </div>
                </AboutLayout>
            </div>
        </main>
    );
}