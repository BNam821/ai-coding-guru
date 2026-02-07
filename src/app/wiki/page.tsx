import Link from "next/link";
import { PageBackground } from "@/components/ui/page-background";
import { GlassCard } from "@/components/ui/glass-card";
import { BookOpen, Clock, User, ArrowRight } from "lucide-react";

const fallbackPosts: any[] = [];

import { isAdminAuthenticated } from "@/lib/auth";

import { supabase } from "@/lib/supabase";

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
                        <Link key={post.slug} href={`/wiki/${post.slug}`}>
                            <GlassCard className="h-full flex flex-col group hover:border-accent-secondary/50 transition-all duration-300">
                                <div className="space-y-4 flex-1">
                                    <div className="inline-block px-3 py-1 rounded-full bg-accent-secondary/10 border border-accent-secondary/20 text-accent-secondary text-xs font-semibold">
                                        {post.category}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white group-hover:text-accent-secondary transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-white text-sm leading-relaxed line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1 text-white"><User size={14} /> {post.author}</span>
                                        <span className="flex items-center gap-1 text-white"><Clock size={14} /> {post.read_time}</span>
                                    </div>
                                    <ArrowRight size={16} className="text-accent-secondary group-hover:translate-x-1 transition-transform" />
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
