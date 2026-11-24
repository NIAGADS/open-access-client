
"use client";

import AboutIntro from "@/data/about-intro.mdx";
import AboutContent from "@/data/about.mdx";
import { Alert, LinkOut } from "@niagads/ui";
import { TextContentLayout } from "@niagads/ui/client";

export default function AboutPage() {
    return (
        <main>
            <div className="content-section content-section-centered">
                <TextContentLayout
                    intro={
                        <div className="mdx-content">
                            <AboutIntro />
                        </div>
                    }
                >
                    <div className="mdx-content">
                        <AboutContent components={{ Alert, LinkOut }} />
                    </div>
                </TextContentLayout>
            </div>
        </main>
    );
}
