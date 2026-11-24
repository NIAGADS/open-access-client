"use client";

import PrivacyPolicyContent from "@/data/privacy-policy.mdx";
import { TextContentLayout } from "@niagads/ui/client";

export default function PrivacyPolicyPage() {
    return (
        <main>
            <div className="content-section content-section-centered">
                <TextContentLayout
                    intro={
                        <div className="mdx-content">
                            <h1>Privacy Policy</h1>
                            <p>Last updated: Pending review</p>
                        </div>
                    }
                >
                    <div className="mdx-content">
                        <PrivacyPolicyContent />
                    </div>
                </TextContentLayout>
            </div>
        </main>
    );
}
