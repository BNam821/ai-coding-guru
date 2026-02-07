import Link from "next/link";
import { PageBackground } from "@/components/ui/page-background";
import { GlassCard } from "@/components/ui/glass-card";
import { BookOpen, Clock, User, ArrowRight } from "lucide-react";
import { DeleteButton } from "@/components/wiki/delete-button";
import { isAdminAuthenticated } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const revalidate = 60; // Tự động cập nhật dữ liệu sau mỗi 60 giây

export default async function WikiPage() {
    const isAdmin = await isAdminAuthenticated();
    let posts: any[] = [];

    try {
        const { data, error } = await supabase
            .from("wiki_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            posts = data;
        }
    } catch (e) {
        console.error("Failed to fetch wiki posts:", e);
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            {/* Gentle Neon Aura */}
            <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-accent-secondary/5 rounded-full blur-[160px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-accent-secondary/3 rounded-full blur-[180px] -z-10" />

            <div className="container mx-auto max-w-6xl">
                <header className="mb-20 text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl lg:text-7xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.6)]">
                            Wiki Kiến thức
                        </h1>
                        <p className="text-white text-xl max-w-2xl mx-auto leading-relaxed font-bold border-b border-white/20 pb-6">
                            Thư viện hướng dẫn sử dụng và kiến thức lập trình dành cho mọi cấp độ.
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex justify-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                            <Link href="/wiki/create">
                                <button className="px-8 py-3 rounded-xl bg-accent-secondary text-black text-sm font-bold hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,163,0.3)]">
                                    <BookOpen size={18} />
                                    Viết bài mới
                                </button>
                            </Link>
                        </div>
                    )}
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post: any) => (
                        <div key={post.slug} className="relative group">
                            <Link href={`/wiki/${post.slug}`} className="block h-full">
                                <GlassCard className="h-full flex flex-col group hover:border-accent-secondary/50 transition-all duration-300 overflow-hidden p-0">
                                    {/* Article Thumbnail */}
                                    <div className="relative w-full h-48 bg-white/5 border-b border-white/10 overflow-hidden">
                                        {post.image_url ? (
                                            <img
                                                src={post.image_url}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                                <BookOpen size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 inline-block px-3 py-1 rounded-full bg-deep-space/80 backdrop-blur-md border border-accent-secondary/20 text-accent-secondary text-[10px] font-bold uppercase tracking-wider">
                                            {post.category}
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4 flex-1">
                                        <h2 className="text-xl font-bold text-white group-hover:text-accent-secondary transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h2>
                                        <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    </div>

                                    <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5"><User size={12} className="text-accent-primary" /> {post.author}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-accent-secondary" /> {post.read_time}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-accent-secondary group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </GlassCard>
                            </Link>

                            {isAdmin && (
                                <DeleteButton slug={post.slug} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
