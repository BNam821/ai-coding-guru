import { getSession } from "@/lib/auth";
import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FeaturesSection } from "@/components/landing/features-section";

export default async function Home() {
    const session = await getSession();

    return (
        <main className="min-h-screen selection:bg-accent-secondary/30 relative z-10">
            <Hero isLoggedIn={!!session} />
            <FeatureGrid />
            <FeaturesSection />
        </main>
    );
}
