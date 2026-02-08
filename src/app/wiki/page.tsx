import { WikiClientPage } from "@/components/wiki/wiki-client-page";

export default function WikiPage() {
    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            {/* Gentle Neon Aura */}
            <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-accent-secondary/5 rounded-full blur-[160px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-accent-secondary/3 rounded-full blur-[180px] -z-10" />

            <div className="container mx-auto max-w-6xl">
                <WikiClientPage />
            </div>
        </main>
    );
}
