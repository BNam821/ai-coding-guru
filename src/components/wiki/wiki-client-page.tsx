"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Bookmark,
    ChevronDown,
    Clock,
    Filter,
    Search,
    ShieldCheck,
    User,
    X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { DeleteButton } from "@/components/wiki/delete-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AuthorRoleBadge } from "@/components/wiki/author-role-badge";

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
    author_role?: string;
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

interface AuthorOption {
    username: string;
    displayName: string;
    normalizedUsername: string;
    normalizedDisplayName: string;
}

function normalizeSearchText(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function levenshteinDistance(source: string, target: string) {
    if (!source.length) return target.length;
    if (!target.length) return source.length;

    const previousRow = Array.from({ length: target.length + 1 }, (_, index) => index);

    for (let i = 1; i <= source.length; i += 1) {
        let diagonal = previousRow[0];
        previousRow[0] = i;

        for (let j = 1; j <= target.length; j += 1) {
            const cached = previousRow[j];
            const cost = source[i - 1] === target[j - 1] ? 0 : 1;

            previousRow[j] = Math.min(
                previousRow[j] + 1,
                previousRow[j - 1] + 1,
                diagonal + cost
            );

            diagonal = cached;
        }
    }

    return previousRow[target.length];
}

function getStringMatchScore(query: string, candidate: string) {
    if (!query || !candidate) return 0;
    if (candidate === query) return 1;
    if (candidate.startsWith(query)) return 0.95;
    if (candidate.includes(query)) return 0.82;

    const queryTokens = query.split(" ").filter(Boolean);
    if (queryTokens.length > 0 && queryTokens.every((token) => candidate.includes(token))) {
        return 0.74;
    }

    const distance = levenshteinDistance(query, candidate);
    const maxLength = Math.max(query.length, candidate.length);
    return maxLength > 0 ? Math.max(0, 1 - distance / maxLength) : 0;
}

function getAuthorMatchScore(query: string, author: AuthorOption) {
    const usernameScore = getStringMatchScore(query, author.normalizedUsername);
    const displayNameScore = getStringMatchScore(query, author.normalizedDisplayName);
    return Math.max(usernameScore, displayNameScore);
}

export function WikiClientPage({ initialData }: WikiClientPageProps) {
    const [posts, setPosts] = useState<WikiPost[]>(initialData?.posts || []);
    const [savedSlugs, setSavedSlugs] = useState<string[]>(initialData?.savedSlugs || []);
    const [categories, setCategories] = useState<string[]>(initialData?.categories || []);
    const [authors, setAuthors] = useState<string[]>(initialData?.authors || []);
    const [isAdmin, setIsAdmin] = useState(initialData?.isAdmin || false);
    const [isLoggedIn, setIsLoggedIn] = useState(initialData?.isLoggedIn || false);
    const [loading, setLoading] = useState(!initialData);
    const [notice, setNotice] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [authorFilter, setAuthorFilter] = useState("");
    const [authorQuery, setAuthorQuery] = useState("");
    const [articleQuery, setArticleQuery] = useState("");
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        if (!initialData) {
            void fetchData();
        }
    }, [initialData]);

    useEffect(() => {
        const flashNotice = sessionStorage.getItem("wiki_notice");
        if (!flashNotice) {
            return;
        }

        setNotice(flashNotice);
        sessionStorage.removeItem("wiki_notice");

        const timeoutId = window.setTimeout(() => {
            setNotice("");
        }, 8000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

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

    const authorOptions = useMemo<AuthorOption[]>(() => {
        return authors.map((username) => {
            const postWithAuthor = posts.find((post) => post.author === username);
            const displayName = postWithAuthor?.author_details?.display_name || username;

            return {
                username,
                displayName,
                normalizedUsername: normalizeSearchText(username),
                normalizedDisplayName: normalizeSearchText(displayName),
            };
        });
    }, [authors, posts]);

    const authorSuggestions = useMemo(() => {
        const normalizedQuery = normalizeSearchText(authorQuery);

        if (!normalizedQuery) {
            return authorOptions.slice(0, 6).map((author) => ({ ...author, score: 0 }));
        }

        return authorOptions
            .map((author) => ({
                ...author,
                score: getAuthorMatchScore(normalizedQuery, author),
            }))
            .filter((author) => author.score >= 0.35)
            .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
            .slice(0, 6);
    }, [authorOptions, authorQuery]);

    useEffect(() => {
        const normalizedQuery = normalizeSearchText(authorQuery);
        if (!normalizedQuery || normalizedQuery.length < 2) {
            if (authorFilter) {
                setAuthorFilter("");
            }
            return;
        }

        const bestMatch = authorSuggestions[0];
        if (bestMatch && bestMatch.score >= 0.55) {
            if (authorFilter !== bestMatch.username) {
                setAuthorFilter(bestMatch.username);
            }
            return;
        }

        if (authorFilter) {
            setAuthorFilter("");
        }
    }, [authorFilter, authorQuery, authorSuggestions]);

    const normalizedArticleQuery = useMemo(() => normalizeSearchText(articleQuery), [articleQuery]);

    const filteredPosts = useMemo(() => {
        let result = posts;

        if (categoryFilter) {
            result = result.filter((post) => post.category === categoryFilter);
        }

        if (authorFilter) {
            result = result.filter((post) => post.author === authorFilter);
        }

        if (normalizedArticleQuery) {
            result = result.filter((post) => {
                const searchableText = normalizeSearchText(
                    `${post.title} ${post.excerpt} ${post.category} ${post.author_details?.display_name || ""} ${post.author}`
                );

                return searchableText.includes(normalizedArticleQuery);
            });
        }

        return result;
    }, [posts, categoryFilter, authorFilter, normalizedArticleQuery]);

    const savedPosts = useMemo(() => {
        let result = posts.filter((post) => savedSlugs.includes(post.slug));

        if (categoryFilter) {
            result = result.filter((post) => post.category === categoryFilter);
        }

        if (authorFilter) {
            result = result.filter((post) => post.author === authorFilter);
        }

        if (normalizedArticleQuery) {
            result = result.filter((post) => {
                const searchableText = normalizeSearchText(
                    `${post.title} ${post.excerpt} ${post.category} ${post.author_details?.display_name || ""} ${post.author}`
                );

                return searchableText.includes(normalizedArticleQuery);
            });
        }

        return result;
    }, [posts, savedSlugs, categoryFilter, authorFilter, normalizedArticleQuery]);

    if (loading) {
        return <LoadingScreen />;
    }

    const displayPosts = showSaved ? savedPosts : filteredPosts;
    const activeAuthor = authorOptions.find((author) => author.username === authorFilter);
    const normalizedAuthorQuery = normalizeSearchText(authorQuery);
    const hasAuthorQuery = normalizedAuthorQuery.length > 0;
    const showSuggestionPanel = hasAuthorQuery || Boolean(activeAuthor);
    const showNoAuthorSuggestion = hasAuthorQuery && authorSuggestions.length === 0;
    const isApproximateMatch =
        activeAuthor != null &&
        normalizedAuthorQuery.length > 0 &&
        normalizedAuthorQuery !== activeAuthor.normalizedUsername &&
        normalizedAuthorQuery !== activeAuthor.normalizedDisplayName;

    return (
        <>
            {false && (
                <div className="mb-6 flex justify-end">
                    <Link href="/dashboard?tab=articles">
                        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition-all hover:border-accent-secondary/30 hover:bg-white/10">
                            Quản lý bài viết
                        </button>
                    </Link>
                </div>
            )}

            <header className="mb-14 space-y-8 text-center">
                <div className="space-y-4">
                    <h1 className="break-words text-4xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.6)] sm:text-5xl lg:text-7xl">
                        Blog Kiến Thức
                    </h1>
                    <p className="mx-auto max-w-2xl border-b border-white/20 pb-6 text-base font-bold leading-relaxed text-white sm:text-xl">
                        Tổng hợp các bài viết về lập trình và AI.
                    </p>
                </div>

                {isLoggedIn && (
                    <div className="animate-in fade-in zoom-in-95 flex flex-col justify-center gap-4 duration-500 sm:flex-row">
                        <Link href="/wiki/create">
                            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-secondary px-8 py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:bg-white sm:w-auto">
                                <BookOpen size={18} />
                                {isAdmin ? "Đăng bài mới" : "Gửi bài để duyệt"}
                            </button>
                        </Link>
                        {isAdmin && (
                            <Link href="/wiki/review">
                                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-8 py-3 text-sm font-bold text-white transition-all hover:border-accent-primary/40 hover:bg-white/15 sm:w-auto">
                                    <ShieldCheck size={18} />
                                    Duyệt bài viết
                                </button>
                            </Link>
                        )}
                    </div>
                )}
            </header>

            {notice && (
                <GlassCard className="mb-8 border-emerald-400/20 bg-emerald-400/10 text-center text-emerald-100" hoverEffect={false}>
                    {notice}
                </GlassCard>
            )}

            <div className="animate-in fade-in slide-in-from-top-4 mb-12 flex flex-wrap items-stretch gap-4 duration-700 sm:items-start lg:items-center">
                <div className="hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-accent-secondary sm:block">
                    <Filter size={18} />
                </div>

                <div className="group relative w-full sm:w-auto sm:min-w-[180px]">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm font-bold text-white/90 transition-all hover:border-accent-secondary/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-secondary/20"
                    >
                        <option value="" className="bg-[#0a0a1a] text-white">Chuyên mục: Tất cả</option>
                        {categories.map((category) => (
                            <option key={category} value={category} className="bg-[#0a0a1a] text-white">
                                {category}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-hover:text-accent-secondary" />
                </div>

                <div className="relative w-full sm:w-[180px] md:w-[200px] lg:w-[220px]">
                    <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            type="search"
                            value={authorQuery}
                            onChange={(e) => setAuthorQuery(e.target.value)}
                            placeholder="Tìm tác giả"
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm font-bold text-white/90 transition-all placeholder:text-white/35 hover:border-accent-primary/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                        />
                    </div>

                    {showSuggestionPanel && (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#090914]/95 shadow-2xl backdrop-blur-xl">
                            {authorSuggestions.map((author) => {
                                const isActive = author.username === authorFilter;

                                return (
                                    <button
                                        key={author.username}
                                        type="button"
                                        onClick={() => {
                                            setAuthorFilter(author.username);
                                            setAuthorQuery(author.displayName);
                                        }}
                                        className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                                            isActive
                                                ? "bg-accent-primary/15 text-white"
                                                : "text-white/80 hover:bg-white/8 hover:text-white"
                                        }`}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold">{author.displayName}</span>
                                            <span className="block truncate text-[11px] uppercase tracking-[0.2em] text-white/35">
                                                @{author.username}
                                            </span>
                                        </span>
                                        {isActive && (
                                            <span className="shrink-0 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent-primary">
                                                Đang lọc
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {showNoAuthorSuggestion && (
                                <div className="px-4 py-3 text-sm text-white/55">
                                    Không thấy tác giả khớp gần đúng. Thử rút ngắn tên hoặc nhập username.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mx-2 hidden h-8 w-px bg-white/10 sm:block" />

                <div className="w-full sm:ml-auto sm:w-[320px] md:w-[380px] lg:w-[440px]">
                    <div className="flex w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-accent-secondary/30 hover:bg-white/10 focus-within:border-accent-secondary/40 focus-within:ring-2 focus-within:ring-accent-secondary/20">
                        <div className="flex shrink-0 items-center gap-2 border-r border-white/10 px-4 text-sm font-bold text-white/80">
                            <Search size={16} />
                            <span className="hidden sm:inline">Tìm kiếm bài viết</span>
                            <span className="sm:hidden">Tìm bài viết</span>
                        </div>
                        <input
                            type="search"
                            value={articleQuery}
                            onChange={(e) => setArticleQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tiêu đề, mô tả"
                            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm font-bold text-white/90 placeholder:text-white/35 focus:outline-none"
                        />
                    </div>
                </div>

                {isLoggedIn && (
                    <button
                        onClick={() => setShowSaved(!showSaved)}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold shadow-lg transition-all sm:w-auto ${
                            showSaved
                                ? "border-accent-primary bg-accent-primary text-black shadow-accent-primary/20"
                                : "border-white/10 bg-white/5 text-white/80 hover:border-accent-primary/30 hover:bg-white/10"
                        }`}
                    >
                        <Bookmark size={16} className={showSaved ? "fill-black" : ""} />
                        Bài viết đã lưu
                    </button>
                )}

                {(categoryFilter || authorFilter || authorQuery || articleQuery) && (
                    <button
                        onClick={() => {
                            setCategoryFilter("");
                            setAuthorFilter("");
                            setAuthorQuery("");
                            setArticleQuery("");
                        }}
                        className="flex w-full items-center justify-center gap-1 px-2 text-xs font-bold text-white/40 transition-colors hover:text-red-400 sm:ml-auto sm:w-auto"
                    >
                        <X size={14} /> Xóa lọc
                    </button>
                )}
            </div>

            {activeAuthor && (
                <div className="mb-8 rounded-2xl border border-accent-primary/15 bg-accent-primary/10 px-4 py-3 text-sm text-white/80">
                    Hiện bài viết của <span className="font-bold text-white">{activeAuthor.displayName}</span>{" "}
                    <span className="text-white/45">(@{activeAuthor.username})</span>
                    {isApproximateMatch && <span className="ml-2 text-white/55">gợi ý từ từ khóa gần đúng.</span>}
                </div>
            )}

            {showSaved ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                            <Bookmark size={24} className="fill-accent-primary text-accent-primary" />
                            Bài viết đã lưu
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
                    </div>
                    {savedPosts.length > 0 ? (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {savedPosts.map((post) => (
                                <WikiCard key={`saved-${post.slug}`} post={post} isAdmin={isAdmin} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-20 text-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-white/40">
                                Bạn chưa lưu bài viết nào
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 grid gap-8 duration-500 md:grid-cols-2 lg:grid-cols-3">
                    {displayPosts.map((post) => (
                        <WikiCard key={post.slug} post={post} isAdmin={isAdmin} />
                    ))}
                </div>
            )}
        </>
    );
}

function WikiCard({ post, isAdmin }: { post: WikiPost; isAdmin: boolean }) {
    return (
        <div className="group relative min-w-0">
            <Link href={`/wiki/${post.slug}`} className="block h-full">
                <GlassCard className="group flex h-full min-w-0 flex-col overflow-hidden p-0 transition-all duration-300 hover:border-accent-secondary/50">
                    <div className="relative h-48 w-full overflow-hidden border-b border-white/10 bg-white/5">
                        {post.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={post.image_url}
                                alt={post.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/20">
                                <BookOpen size={48} />
                            </div>
                        )}
                        <div className="absolute left-4 top-4 inline-block rounded-full border border-accent-secondary/20 bg-deep-space/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-secondary backdrop-blur-md">
                            {post.category}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 p-5 sm:p-6">
                        <AuthorRoleBadge role={post.author_role} />
                        <h2 className="line-clamp-2 break-words text-xl font-bold leading-tight text-white transition-colors group-hover:text-accent-secondary">
                            {post.title}
                        </h2>
                        <p className="line-clamp-2 break-words text-sm leading-relaxed text-white/60">
                            {post.excerpt}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 sm:px-6">
                        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
                            <span className="flex min-w-0 items-center gap-1.5">
                                {post.author_details?.avatar_url ? (
                                    <div className="h-4 w-4 overflow-hidden rounded-full border border-white/10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={post.author_details.avatar_url} className="h-full w-full object-cover" alt="" />
                                    </div>
                                ) : (
                                    <User size={12} className="text-accent-primary" />
                                )}
                                <span className="truncate">{post.author_details?.display_name || post.author}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock size={12} className="text-accent-secondary" /> {post.read_time}
                            </span>
                        </div>
                        <ArrowRight size={14} className="text-accent-secondary transition-transform group-hover:translate-x-1" />
                    </div>
                </GlassCard>
            </Link>

            {isAdmin && <DeleteButton slug={post.slug} />}
        </div>
    );
}
