import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FeaturesSection } from "@/components/landing/features-section";

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-accent-secondary/30 relative z-10">
      <Hero />
      <FeatureGrid />
      <FeaturesSection />

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 mt-20">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} AI Coding Guru. Powered by Google Antigravity.</p>
        </div>
      </footer>
    </main>
  );
}
