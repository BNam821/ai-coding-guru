import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, hoverEffect = true }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "glass-panel rounded-2xl p-6 transition-all duration-300 border border-white/5 bg-white/5 backdrop-blur-md",
                    hoverEffect && "hover:bg-white/10 hover:border-accent-secondary/30 hover:shadow-[0_0_30px_rgba(0,223,154,0.1)] hover:-translate-y-1",
                    className
                )}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = "GlassCard";
