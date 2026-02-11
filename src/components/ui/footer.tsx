"use client";

import React from "react";

export function Footer() {
    return (
        <footer className="relative z-50 py-2 px-4 mt-auto">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 opacity-20 hover:opacity-100 transition-opacity duration-500">
                <p className="text-[10px] tracking-widest uppercase order-2 md:order-1 whitespace-nowrap">
                    © 2026 Google Antigravity. Phát triển với <span className="mx-0.5">❤️</span> bởi <span>CamPha8</span>.
                </p>

                <div className="flex items-center gap-4 order-1 md:order-2">
                    <a
                        href="mailto:contact@aicodingguru.com"
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
