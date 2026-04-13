"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RouteTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const currentPath = sessionStorage.getItem("currentPath");
        
        // If pathname changed, update history
        if (currentPath !== pathname) {
            if (currentPath) {
                // We keep track of the immediate previous path
                sessionStorage.setItem("previousPath", currentPath);
            }
            sessionStorage.setItem("currentPath", pathname || "/");
        }
    }, [pathname]);

    return null;
}
