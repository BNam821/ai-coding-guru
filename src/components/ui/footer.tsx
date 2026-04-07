"use client";

import React from "react";

export function Footer() {
    return (
        <footer className="relative z-50 mt-auto px-4 py-3 sm:py-2">
            <div className="container mx-auto flex flex-col items-center justify-between gap-2 opacity-20 transition-opacity duration-500 hover:opacity-100 md:flex-row">
                <p className="order-2 text-center text-[10px] uppercase tracking-widest md:order-1 md:whitespace-nowrap">
                    © 2026 Google Antigravity & OpenAI Codex. Phát triển với <span className="mx-0.5">❤️</span> bởi <span>CamPha8</span>.
                </p>

                <div className="order-1 flex items-center gap-4 md:order-2">
                    <a
                        href="https://www.facebook.com/bnam8210/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-primary text-[10px] tracking-widest uppercase transition-colors"
                    >
                        Liên hệ
                    </a>
                    <a
                        href="https://github.com/BNam821/ai-coding-guru"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-secondary text-[10px] tracking-widest uppercase transition-colors"
                    >
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
}
