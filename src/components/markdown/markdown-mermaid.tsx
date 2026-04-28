"use client";

import React, { useEffect, useId, useRef, useState, memo } from "react";
import { AlertCircle, Loader2, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownMermaidProps {
    code: string;
    className?: string;
}

/**
 * MarkdownMermaid - A highly robust Mermaid diagram renderer for Next.js App Router.
 * 
 * Key features:
 * - Dynamic library loading (Reduced bundle size & SSR safe)
 * - Hydration error prevention (Client-only rendering pass)
 * - Robust error handling with source code fallback
 * - Automatic cleanup and cancellation support
 */
const MarkdownMermaidComponent = ({ code, className }: MarkdownMermaidProps) => {
    const id = useId().replace(/:/g, "");
    const [svg, setSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showSource, setShowSource] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Mark as mounted only on client to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Handle diagram rendering lifecycle
    useEffect(() => {
        if (!isMounted) return;

        let isCancelled = false;

        const renderDiagram = async () => {
            setIsRendering(true);
            setError(null);

            try {
                // Dynamic import to keep it out of the server bundle and optimize load
                const mermaid = (await import("mermaid")).default;

                // Configure mermaid (can be called multiple times, but effectively a singleton config)
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "base",
                    securityLevel: "strict",
                    fontFamily: "inherit",
                    themeVariables: {
                        darkMode: true,
                        primaryColor: "#0b0d11", // Khớp với nền deep-space
                        primaryTextColor: "#ffffff",
                        primaryBorderColor: "#00df9a",
                        lineColor: "#00df9a",
                        secondaryColor: "#1e293b",
                        tertiaryColor: "#0b0d11",
                        mainBkg: "#0b0d11",
                    },
                    themeCSS: `
                        .node rect, .node circle, .node polygon, .node path, .node ellipse {
                            fill: #1e1e26 !important; /* Nền ô xám đậm để phân biệt với nền trang */
                            stroke: #00df9a !important;
                            stroke-width: 1.5px !important;
                        }
                        .node .label, .node text, .label text {
                            fill: #ffffff !important;
                            color: #ffffff !important;
                            font-weight: 600 !important;
                        }
                        .edgePath .path {
                            stroke: #00df9a !important;
                        }
                        .arrowheadPath {
                            fill: #00df9a !important;
                        }
                        .edgeLabel, .edgeLabel span {
                            color: #ffffff !important;
                            background-color: #0b0d11 !important;
                        }
                        .cluster rect {
                            fill: rgba(255, 255, 255, 0.05) !important;
                            stroke: rgba(255, 255, 255, 0.2) !important;
                        }
                    `
                });

                // Clear previous content if any
                if (containerRef.current) {
                    containerRef.current.innerHTML = "";
                }

                // Mermaid render can be finicky; we use a unique ID and the async API
                const result = await mermaid.render(`mermaid-${id}`, code);
                
                if (!isCancelled) {
                    setSvg(result.svg);
                }
            } catch (err: any) {
                console.error("Mermaid rendering error:", err);
                if (!isCancelled) {
                    // Extract a meaningful error message if possible
                    setError(err.message || "Không thể xử lý cú pháp sơ đồ này.");
                }
            } finally {
                if (!isCancelled) {
                    setIsRendering(false);
                }
            }
        };

        // Small delay to ensure browser APIs like getBBox are ready if transition is happening
        const timeoutId = setTimeout(renderDiagram, 50);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [code, id, isMounted]);

    // Initial server-side render and first client pass (skeleton/placeholder)
    if (!isMounted) {
        return (
            <div className={cn("my-6 h-32 w-full animate-pulse rounded-xl border border-white/5 bg-white/5", className)} />
        );
    }

    return (
        <div 
            className={cn(
                "group relative my-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/20",
                className
            )}
        >
            {/* Loading Indicator */}
            {isRendering && !svg && (
                <div className="flex flex-col items-center gap-3 py-10 text-white/40">
                    <Loader2 size={24} className="animate-spin text-accent-secondary" />
                    <span className="text-xs font-medium tracking-wider uppercase">Đang phác thảo sơ đồ...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="w-full flex flex-col items-center gap-4 py-4">
                    <div className="flex flex-col items-center gap-2 text-rose-400">
                        <AlertCircle size={28} />
                        <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-rose-300">Lỗi Sơ Đồ</p>
                            <p className="mt-1 text-xs opacity-70 max-w-md px-4 leading-relaxed">
                                {error}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSource(!showSource)}
                        className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-tight text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
                    >
                        <Code2 size={12} />
                        {showSource ? "Ẩn mã nguồn" : "Xem mã nguồn Mermaid"}
                        {showSource ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {showSource && (
                        <pre className="mt-2 w-full max-w-2xl overflow-x-auto rounded-lg bg-black/40 p-4 text-[11px] leading-relaxed text-blue-300/80 scrollbar-thin scrollbar-thumb-white/10">
                            <code>{code}</code>
                        </pre>
                    )}
                </div>
            )}

            {/* Success State - Mermaid Rendered Diagram */}
            {!error && svg && (
                <div 
                    ref={containerRef}
                    className={cn(
                        "mermaid-wrapper w-full flex justify-center transition-opacity duration-500 [&>svg]:max-w-full [&>svg]:h-auto",
                        isRendering ? "opacity-40" : "opacity-100"
                    )}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            )}
            
            {/* Micro-interaction: Diagram Label */}
            {!isRendering && !error && svg && (
                <div className="absolute top-3 left-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Mermaid Diagram</span>
                </div>
            )}
        </div>
    );
};

// Use memo to prevent re-renders unless code actually changes, highly recommended for mermaid
export const MarkdownMermaid = memo(MarkdownMermaidComponent);
