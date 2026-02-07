import { PageBackground } from "@/components/ui/page-background";

export default function TestPage() {
    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-primary/5 rounded-full blur-[120px] -z-10" />
            <div className="container mx-auto text-center space-y-8">
                <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Hệ thống Kiểm tra</h1>
                <p className="text-white text-xl max-w-2xl mx-auto font-bold">
                    Nơi bạn thử thách bản thân với các bài Quiz và Online Judge AI.
                </p>
                <div className="inline-block px-8 py-4 glass-panel rounded-2xl border border-white/10 text-accent-primary animate-pulse">
                    Đang thiết lập phòng thi...
                </div>
            </div>
        </main>
    );
}
