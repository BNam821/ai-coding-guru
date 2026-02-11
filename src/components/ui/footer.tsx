"use client";

import React from "react";

export function Footer() {
    return (
        <footer className="relative z-50 py-8 px-4 mt-auto border-t border-white/5 bg-deep-space/50 backdrop-blur-md">
            <div className="container mx-auto text-center">
                <p className="text-white/40 text-sm font-medium tracking-wide">
                    Made by <span className="text-accent-secondary font-bold">CamPha8</span> -
                    <span className="text-accent-primary font-bold"> Google Antigravity</span> with <span className="text-red-500 animate-pulse">❤️</span>
                </p>
            </div>
        </footer>
    );
}
