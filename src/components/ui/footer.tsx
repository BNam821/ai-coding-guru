"use client";

import React from "react";

export function Footer() {
    return (
        <footer className="relative z-50 py-6 px-4 mt-auto border-t border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-white/40 text-sm font-medium tracking-tight order-2 md:order-1">
                    © 2026 Google Antigravity. Phát triển với <span className="text-red-500/80 mx-1">❤️</span> bởi <span className="text-white/60 font-semibold">CamPha8</span>.
                </p>

                <div className="flex items-center gap-6 order-1 md:order-2">
                    <a
                        href="mailto:contact@aicodingguru.com"
                        className="text-white/40 hover:text-accent-primary text-sm font-bold transition-colors"
                    >
                        Liên hệ
                    </a>
                    <a
                        href="https://github.com/BNam821/ai-coding-guru"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-accent-secondary text-sm font-bold transition-colors"
                    >
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
}
