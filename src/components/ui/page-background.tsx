"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface PageBackgroundProps {
    src: string;
    alt?: string;
    className?: string;
    opacity?: number;
    overlayColor?: string;
    blur?: string;
}

export function PageBackground({
    src,
    alt = "Background",
    className,
    opacity = 0.5,
    overlayColor = "black", // Default to black for better text contrast
    blur = "0px",
}: PageBackgroundProps) {
    return (
        <div className={cn("fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none select-none", className)}>
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
                <Image
                    src={src}
                    alt={alt}
                    fill
                    priority
                    className="object-cover object-center"
                    style={{
                        opacity: opacity,
                        filter: blur !== "0px" ? `blur(${blur})` : "none"
                    }}
                />
            </div>

            {/* Overlay Layer for better contrast/tinting */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{ background: overlayColor, opacity: 0.4 }} // Fixed base opacity for the mix-blend
            />

            {/* Vignette effect for focus */}
            <div
                className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"
            />
        </div>
    );
}
