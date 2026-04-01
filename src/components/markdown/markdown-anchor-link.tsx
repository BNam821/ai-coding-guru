"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { getHashTarget, scrollToHashTarget } from "./markdown-hash-scroll";

type MarkdownAnchorLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>): boolean {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function MarkdownAnchorLink({
    href = "",
    className,
    onClick,
    children,
    ...props
}: MarkdownAnchorLinkProps) {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);

        if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
            return;
        }

        if (!getHashTarget(href)) {
            return;
        }

        event.preventDefault();
        scrollToHashTarget(href, "smooth");
    };

    return (
        <a href={href} className={cn(className)} onClick={handleClick} {...props}>
            {children}
        </a>
    );
}
