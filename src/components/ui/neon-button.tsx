import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    children: ReactNode;
    icon?: ReactNode;
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ variant = "primary", className, children, icon, ...props }, ref) => {
        const variants = {
            primary: "bg-accent-secondary text-deep-space font-extrabold hover:shadow-[0_0_25px_rgba(0,223,154,0.6)] border-transparent",
            secondary: "bg-accent-primary text-deep-space font-extrabold hover:shadow-[0_0_25px_rgba(255,204,0,0.6)] border-transparent",
            outline: "bg-transparent border-2 border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-deep-space hover:shadow-[0_0_20px_rgba(0,223,154,0.4)]",
            ghost: "bg-transparent text-starlight hover:text-accent-secondary hover:bg-white/5",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "group relative flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm uppercase tracking-wider transition-all duration-300 sm:w-auto sm:px-8 sm:py-3.5",
                    variants[variant],
                    className
                )}
                {...props}
            >
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                    {icon && <span className="transition-transform group-hover:translate-x-1">{icon}</span>}
                </span>
            </button>
        );
    }
);

NeonButton.displayName = "NeonButton";
