"use client";

import { useEffect } from "react";
import { scheduleHashScroll } from "./markdown-hash-scroll";

interface MarkdownHashScrollManagerProps {
    enabled?: boolean;
}

export function MarkdownHashScrollManager({
    enabled = true,
}: MarkdownHashScrollManagerProps) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (window.location.hash) {
            scheduleHashScroll(window.location.hash, "auto");
        }

        const handleHashChange = () => {
            if (window.location.hash) {
                scheduleHashScroll(window.location.hash, "smooth");
            }
        };

        window.addEventListener("hashchange", handleHashChange);

        return () => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, [enabled]);

    return null;
}
