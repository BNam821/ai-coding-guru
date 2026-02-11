"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { BookOpen, Clock, User, ArrowRight, Bookmark, Filter, ChevronDown, X } from "lucide-react";
import { DeleteButton } from "@/components/wiki/delete-button";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface WikiPost {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    author_details?: {
        display_name: string;
        avatar_url: string;
    };
    category: string;
    image_url?: string;
    read_time: string;
    created_at: string;
}

interface WikiClientPageProps {
    initialData?: {
        posts: WikiPost[];
        savedSlugs: string[];
        categories: string[];
        authors: string[];
        isAdmin: boolean;
        isLoggedIn: boolean;
    };
}

export function WikiClientPage({ initialData }: WikiClientPageProps) {
    // State cho dữ liệu
    const [posts, setPosts] = useState<WikiPost[]>(initialData?.posts || []);
    const [savedSlugs, setSavedSlugs] = useState<string[]>(initialData?.savedSlugs || []);
    const [categories, setCategories] = useState<string[]>(initialData?.categories || []);
    const [authors, setAuthors] = useState<string[]>(initialData?.authors || []);
    const [isAdmin, setIsAdmin] = useState(initialData?.isAdmin || false);
    const [isLoggedIn, setIsLoggedIn] = useState(initialData?.isLoggedIn || false);
    const [loading, setLoading] = useState(!initialData);

    // State cho filters (Client-side - không reload trang)
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [authorFilter, setAuthorFilter] = useState<string>("");
    const [showSaved, setShowSaved] = useState(false);

    // Fetch dữ liệu nếu không có initialData
    useEffect(() => {
        if (!initialData) {
            fetchData();
        }
    }, [initialData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/wiki/all");
            const data = await res.json();
            if (data.success) {
                setPosts(data.posts);
                setSavedSlugs(data.savedSlugs);
                setCategories(data.categories);
                setAuthors(data.authors);
                setIsAdmin(data.isAdmin);
                setIsLoggedIn(data.isLoggedIn);
            }
        } catch (error) {
            console.error("Failed to fetch wiki data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Lọc posts client-side (Tức thì, không cần gọi server)
    const filteredPosts = useMemo(() => {
        let result = posts;

        if (categoryFilter) {
            result = result.filter(p => p.category === categoryFilter);
        }
        if (authorFilter) {
            result = result.filter(p => p.author === authorFilter);
        }

        return result;
    }, [posts, categoryFilter, authorFilter]);

    // Lọc saved posts client-side
    const savedPosts = useMemo(() => {
        let result = posts.filter(p => savedSlugs.includes(p.slug));

        if (categoryFilter) {
            result = result.filter(p => p.category === categoryFilter);
        }
        if (authorFilter) {
            result = result.filter(p => p.author === authorFilter);
        }

        return result;
    }, [posts, savedSlugs, categoryFilter, authorFilter]);

    // Hiển thị loading state
    if (loading) {
        return <LoadingScreen />;
    }

    const displayPosts = showSaved ? savedPosts : filteredPosts;

    return (
        <>
            <header className="mb-14 text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-5xl lg:text-7xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.6)]">
                        Blog Kiến Thức
                    </h1>
                    <p className="text-white text-xl max-w-2xl mx-auto leading-relaxed font-bold border-b border-white/20 pb-6">
                        Tổng hợp các bài viết về lập trình và AI.
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

            {/* Client-side Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-accent-secondary">
                    <Filter size={18} />
                </div>

                {/* Category Dropdown */}
                <div className="relative group min-w-[180px]">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full appearance-none bg-white/5 border border-white/10 text-white/90 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 hover:bg-white/10 hover:border-accent-secondary/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 cursor-pointer"
                    >
                        <option value="" className="bg-[#0a0a1a] text-white">Chuyên mục: Tất cả</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat} className="bg-[#0a0a1a] text-white">{cat}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover:text-accent-secondary transition-colors" />
                </div>

                {/* Author Dropdown */}
                <div className="relative group min-w-[220px]">
                    <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full appearance-none bg-white/5 border border-white/10 text-white/90 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 hover:bg-white/10 hover:border-accent-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/20 cursor-pointer"
                    >
                        <option value="" className="bg-[#0a0a1a] text-white">Tác giả: Tất cả</option>
                        {authors.map((username) => {
                            // Tìm display_name từ posts nếu có
                            const postWithAuthor = posts.find(p => p.author === username);
                            const displayName = postWithAuthor?.author_details?.display_name || username;
                            return (
                                <option key={username} value={username} className="bg-[#0a0a1a] text-white">
                                    {displayName}
                                </option>
                            );
                        })}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none group-hover:text-accent-primary transition-colors" />
                </div>

                <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />

                {/* Saved Posts Toggle Button */}
                {isLoggedIn && (
                    <button
                        onClick={() => setShowSaved(!showSaved)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-lg ${showSaved
                            ? "bg-accent-primary border-accent-primary text-black shadow-accent-primary/20"
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-accent-primary/30"
                            }`}
                    >
                        <Bookmark size={16} className={showSaved ? "fill-black" : ""} />
                        Bài viết đã lưu
                    </button>
                )}

                {/* Clear Filters */}
                {(categoryFilter || authorFilter) && (
                    <button
                        onClick={() => {
                            setCategoryFilter("");
                            setAuthorFilter("");
                        }}
                        className="text-xs font-bold text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors ml-auto px-2"
                    >
                        <X size={14} /> Xóa lọc
                    </button>
                )}
            </div>

            {/* Content Section */}
            {showSaved ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Bookmark size={24} className="text-accent-primary fill-accent-primary" />
                            Bài viết đã lưu
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                    </div>
                    {savedPosts.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {savedPosts.map((post) => (
                                <WikiCard key={`saved-${post.slug}`} post={post} isAdmin={isAdmin} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 px-4 rounded-3xl bg-white/5 border border-dashed border-white/10">
                            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Bạn chưa lưu bài viết nào</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {displayPosts.map((post) => (
                        <WikiCard key={post.slug} post={post} isAdmin={isAdmin} />
                    ))}
                </div>
            )}
        </>
    );
}

function WikiCard({ post, isAdmin }: { post: WikiPost, isAdmin: boolean }) {
    return (
        <div className="relative group">
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
                            <span className="flex items-center gap-1.5">
                                {post.author_details?.avatar_url ? (
                                    <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10">
                                        <img src={post.author_details.avatar_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ) : (
                                    <User size={12} className="text-accent-primary" />
                                )}
                                {post.author_details?.display_name || post.author}
                            </span>
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
    );
}
