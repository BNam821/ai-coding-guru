import { isUserAuthenticated, getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, BookMarked, History } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { HistoryTracker } from "@/components/history/history-tracker";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
    const session = await getSession();
    const isLoggedIn = !!session;

    let history: any[] = [];

    if (isLoggedIn) {
        const { data } = await supabase
            .from("user_learning_history")
            .select("*")
            .eq("username", session.username)
            .order("updated_at", { ascending: false });
        history = data || [];
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[160px] -z-10" />

            <div className="container mx-auto max-w-4xl">
                <div className="mb-12 space-y-4 text-center md:text-left">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white flex items-center justify-center md:justify-start gap-4">
                        <History size={40} className="text-blue-400" />
                        Lịch sử học tập
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Danh sách các bài học bạn đã từng truy cập trong thời gian qua.
                    </p>
                </div>

                {!isLoggedIn ? (
                    <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-6">
                        <BookMarked size={64} className="mx-auto text-gray-600" />
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Tính năng yêu cầu đăng nhập</h3>
                            <p className="text-gray-400 max-w-sm mx-auto">
                                Hãy đăng nhập tài khoản để đồng bộ và xem lại toàn bộ lịch sử học tập của bạn trên mọi thiết bị.
                            </p>
                        </div>
                        <Link
                            href="/account"
                            className="inline-block px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
                        >
                            Đăng nhập ngay
                        </Link>
                    </div>
                ) : history.length > 0 ? (
                    <div className="grid gap-4">
                        {history.map((item) => (
                            <Link
                                key={item.id}
                                href={`/learn/${item.course_slug}/${item.lesson_slug}`}
                                className="group"
                            >
                                <GlassCard className="p-6 hover:border-blue-500/50 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                                                <BookOpen size={24} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">
                                                    {item.course_slug.replace('-', ' ')}
                                                </div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {item.lesson_title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                    <Clock size={14} />
                                                    {new Date(item.updated_at).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-gray-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
                                    </div>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-4">
                        <BookOpen size={48} className="mx-auto text-gray-600" />
                        <p className="text-gray-500 font-medium">Bạn chưa bắt đầu bài học nào cả.</p>
                        <Link href="/learn" className="text-blue-400 font-bold hover:underline">
                            Bắt đầu học ngay →
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
