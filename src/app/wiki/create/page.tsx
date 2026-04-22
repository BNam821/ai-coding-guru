"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Send, Tag, Type, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";

type SessionData = {
    username: string | null;
    role: string | null;
};

export default function CreatePostPage() {
    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("HÆ°á»›ng dáº«n");
    const [author, setAuthor] = useState("");
    const [role, setRole] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const submitLockRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = (await res.json()) as SessionData;

                if (!data.username) {
                    setError("Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ táº¡o bÃ i viáº¿t má»›i.");
                    return;
                }

                setAuthor(data.username);
                setRole(data.role);
            } catch {
                setError("KhÃ´ng thá»ƒ xÃ¡c thá»±c tÃ i khoáº£n hiá»‡n táº¡i.");
            } finally {
                setIsCheckingSession(false);
            }
        };

        checkSession();
    }, []);

    const isAdmin = role === "admin";
    const submitLabel = isAdmin ? "ÄÄƒng bÃ i" : "Gá»­i bÃ i Ä‘á»ƒ duyá»‡t";
    const helperText = isAdmin
        ? "BÃ i viáº¿t cá»§a ADMIN sáº½ Ä‘Æ°á»£c Ä‘Äƒng ngay lÃªn Wiki."
        : "BÃ i viáº¿t cá»§a MEMBER sáº½ Ä‘Æ°á»£c lÆ°u vÃ o Supabase vÃ  chá» Ä‘á»™i dá»± Ã¡n duyá»‡t trÆ°á»›c khi xuáº¥t hiá»‡n trÃªn /wiki.";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitLockRef.current || isLoading) {
            return;
        }

        if (!author) {
            setError("Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ gá»­i bÃ i viáº¿t.");
            return;
        }

        submitLockRef.current = true;
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/wiki", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, excerpt, content, category, image_url: imageUrl }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error || "KhÃ´ng thá»ƒ xá»­ lÃ½ bÃ i viáº¿t. Vui lÃ²ng thá»­ láº¡i.");
                return;
            }

            if (data.moderationStatus === "published") {
                router.push("/wiki");
                router.refresh();
                return;
            }

            sessionStorage.setItem(
                "wiki_notice",
                data.message || "BÃ i viáº¿t Ä‘Ã£ Ä‘Æ°á»£c gá»­i thÃ nh cÃ´ng vÃ  Ä‘ang chá» duyá»‡t."
            );
            router.push("/wiki");
            router.refresh();
        } catch {
            setError("ÄÃ£ cÃ³ lá»—i xáº£y ra khi káº¿t ná»‘i server.");
        } finally {
            submitLockRef.current = false;
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[150px] -z-10" />

            <div className="container mx-auto max-w-4xl">
                <Link href="/wiki" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Há»§y vÃ  quay láº¡i</span>
                </Link>

                <header className="mb-12 space-y-4">
                    <h1 className="text-4xl font-bold text-white">Soáº¡n bÃ i viáº¿t má»›i</h1>
                    <p className="text-white/60 max-w-3xl">{helperText}</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid md:grid-cols-[1fr_250px] gap-8">
                        <div className="space-y-6">
                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <Type size={18} className="text-accent-secondary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">TiÃªu Ä‘á» bÃ i viáº¿t</span>
                                </div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="VÃ­ dá»¥: CÃ¡ch tá»‘i Æ°u React Performance 2026"
                                    className="w-full bg-transparent p-6 text-2xl font-bold text-white focus:outline-none placeholder:text-white/20"
                                    required
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <FileText size={18} className="text-accent-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">TÃ³m táº¯t ngáº¯n</span>
                                </div>
                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="MÃ´ táº£ ngáº¯n gá»n ná»™i dung bÃ i viáº¿t..."
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 min-h-[100px] resize-none"
                                    required
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <Tag size={18} className="text-accent-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Link áº£nh bÃ¬a</span>
                                </div>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 text-sm"
                                />
                            </GlassCard>

                            <GlassCard className="p-1 border-white/10 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                                    <FileText size={18} className="text-accent-secondary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Ná»™i dung chi tiáº¿t</span>
                                </div>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Há»— trá»£ Markdown má»Ÿ rá»™ng: # Heading, **In Ä‘áº­m**, [Link](url), $E=mc^2$, $$a^2+b^2=c^2$$ ..."
                                    className="w-full bg-transparent p-6 text-white focus:outline-none placeholder:text-white/20 min-h-[400px] leading-relaxed font-mono"
                                    required
                                />
                            </GlassCard>
                        </div>

                        <aside className="space-y-6">
                            <GlassCard className="p-6 border-white/10 space-y-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                        <User size={14} /> TÃ¡c giáº£
                                    </label>
                                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-bold text-accent-primary">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            {isCheckingSession ? "Äang xÃ¡c thá»±c..." : (author || "ChÆ°a Ä‘Äƒng nháº­p")}
                                        </div>
                                        {role && <AuthorRoleBadge role={role} />}
                                    </div>
                                    <p className="text-[10px] text-white/30 italic">TÃªn tÃ¡c giáº£ Ä‘Æ°á»£c gáº¯n tá»± Ä‘á»™ng theo tÃ i khoáº£n hiá»‡n táº¡i.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40">
                                        <Tag size={14} /> ChuyÃªn má»¥c
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accent-secondary/50 appearance-none"
                                    >
                                        <option value="HÆ°á»›ng dáº«n" className="bg-deep-space">HÆ°á»›ng dáº«n</option>
                                        <option value="NgÃ´n ngá»¯" className="bg-deep-space">NgÃ´n ngá»¯</option>
                                        <option value="AI & ML" className="bg-deep-space">AI & ML</option>
                                        <option value="DevOps" className="bg-deep-space">DevOps</option>
                                    </select>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                                    {isAdmin
                                        ? "Báº¡n Ä‘ang á»Ÿ cháº¿ Ä‘á»™ ADMIN. BÃ i viáº¿t sáº½ Ä‘Æ°á»£c publish ngay náº¿u há»£p lá»‡."
                                        : "Báº¡n Ä‘ang á»Ÿ cháº¿ Ä‘á»™ MEMBER. BÃ i viáº¿t sáº½ vÃ o hÃ ng chá» duyá»‡t trong Supabase trÆ°á»›c khi publish."}
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}
                                    <NeonButton
                                        type="submit"
                                        variant="secondary"
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 normal-case tracking-normal"
                                        disabled={isLoading || isCheckingSession || !author}
                                    >
                                        {isLoading ? "Äang xá»­ lÃ½..." : <><Send size={18} /> {submitLabel}</>}
                                    </NeonButton>
                                    <p className="text-[10px] text-white/30 text-center mt-4">
                                        CÃ³ thá»ƒ dÃ¹ng cÃ´ng thá»©c toÃ¡n, báº£ng, checklist vÃ  heading linkable.
                                    </p>
                                </div>
                            </GlassCard>
                        </aside>
                    </div>
                </form>
            </div>
        </main>
    );
}
