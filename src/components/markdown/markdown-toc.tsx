"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

export interface MarkdownHeading {
    depth: number;
    text: string;
    slug: string;
}

interface MarkdownTocProps {
    headings: MarkdownHeading[];
}

export function MarkdownToc({ headings }: MarkdownTocProps) {
    const [activeSlug, setActiveSlug] = useState<string>(headings[0]?.slug || "");

    useEffect(() => {
        if (headings.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

                if (visible[0]?.target.id) {
                    setActiveSlug(visible[0].target.id);
                }
            },
            {
                rootMargin: "-96px 0px -55% 0px",
                threshold: [0.1, 0.4, 0.7],
            }
        );

        const elements = headings
            .map((heading) => document.getElementById(heading.slug))
            .filter((element): element is HTMLElement => Boolean(element));

        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) {
        return null;
    }

    const handleClick = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
        event.preventDefault();

        const target = document.getElementById(slug);
        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        setActiveSlug(slug);
        window.history.replaceState(null, "", `#${slug}`);
    };

    return (
        <div className="mb-10 rounded-[1.75rem] border border-accent-secondary/15 bg-[linear-gradient(180deg,rgba(0,223,154,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_0_24px_rgba(0,223,154,0.08)]">
            <p className="mb-5 text-sm font-black uppercase tracking-[0.32em] text-accent-secondary/90">
                Mục lục
            </p>
            <nav className="space-y-2">
                {headings.map((heading) => (
                    <a
                        key={`${heading.slug}-${heading.depth}`}
                        href={`#${heading.slug}`}
                        onClick={(event) => handleClick(event, heading.slug)}
                        className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                            activeSlug === heading.slug
                                ? "bg-accent-secondary/12 text-white shadow-[inset_0_0_0_1px_rgba(0,223,154,0.18)]"
                                : "text-white/78 hover:bg-white/6 hover:text-white"
                        }`}
                        style={{ paddingLeft: `${0.875 + (heading.depth - 2) * 1}rem` }}
                    >
                        <span
                            className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                                activeSlug === heading.slug
                                    ? "scale-125 bg-accent-secondary shadow-[0_0_10px_rgba(0,223,154,0.55)]"
                                    : "bg-accent-secondary/35 group-hover:scale-125 group-hover:bg-accent-secondary"
                            }`}
                        />
                        {heading.text}
                    </a>
                ))}
            </nav>
        </div>
    );
}
