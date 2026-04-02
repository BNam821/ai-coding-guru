import { cn } from "@/lib/utils";
import { getWikiAuthorRole } from "@/lib/wiki";

interface AuthorRoleBadgeProps {
    role?: string | null;
    className?: string;
}

export function AuthorRoleBadge({ role, className }: AuthorRoleBadgeProps) {
    const normalizedRole = getWikiAuthorRole(role);
    const isAdmin = normalizedRole === "admin";

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                isAdmin
                    ? "border-accent-secondary/30 bg-accent-secondary/15 text-accent-secondary"
                    : "border-blue-400/30 bg-blue-400/15 text-blue-300",
                className
            )}
        >
            {isAdmin ? "ADMIN" : "MEMBER"}
        </span>
    );
}

