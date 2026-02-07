import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    children: ReactNode;
    icon?: ReactNode;
}

export function NeonButton({ variant = "primary", className, children, icon, ...props }: NeonButtonProps) {
    const variants = {
        primary: "bg-accent-secondary text-deep-space font-extrabold hover:shadow-[0_0_25px_rgba(0,223,154,0.6)] border-transparent",
        secondary: "bg-accent-primary text-deep-space font-extrabold hover:shadow-[0_0_25px_rgba(255,204,0,0.6)] border-transparent",
        outline: "bg-transparent border-2 border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-deep-space hover:shadow-[0_0_20px_rgba(0,223,154,0.4)]",
        ghost: "bg-transparent text-starlight hover:text-accent-secondary hover:bg-white/5",
    };

    return (
        <button
            className={cn(
                "relative rounded-full px-8 py-3.5 uppercase tracking-wider text-sm transition-all duration-300 flex items-center justify-center gap-2 group",
                variants[variant],
                className
            )}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {children}
                {icon && <span className="group-hover:translate-x-1 transition-transform">{icon}</span>}
            </span>
        </button>
    );
}
