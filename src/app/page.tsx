import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FeaturesSection } from "@/components/landing/features-section";

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-accent-secondary/30 relative z-10">
      <Hero />
      <FeatureGrid />
      <FeaturesSection />
    </main>
  );
}
