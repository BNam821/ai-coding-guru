import { AuthRequiredBanner } from "@/components/landing/auth-required-banner";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FeaturesSection } from "@/components/landing/features-section";
import { Hero } from "@/components/landing/hero";
import { PageBackground } from "@/components/ui/page-background";

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ auth?: string }>;
}) {
    const { auth } = await searchParams;

    return (
        <main className="relative z-10 min-h-screen selection:bg-accent-secondary/30">
            <PageBackground
                src="/bgt2.jpg"
                opacity={1.0}
                blur="0px"
                overlayColor="black"
            />
            {auth === "required" && <AuthRequiredBanner />}
            <Hero />
            <FeatureGrid />
            <FeaturesSection />

            <footer className="mt-20 border-t border-white/5 py-8">
                <div className="container mx-auto px-4 text-center text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} AI Coding Guru. Powered by Google Antigravity.</p>
                </div>
            </footer>
        </main>
    );
}
