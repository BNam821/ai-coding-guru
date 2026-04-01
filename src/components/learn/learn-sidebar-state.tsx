'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface LearnSidebarStateValue {
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (next: boolean) => void;
}

const LearnSidebarStateContext = createContext<LearnSidebarStateValue | null>(null);

function getDefaultCollapsed(pathname: string): boolean {
    return /^\/learn\/[^/]+\/[^/]+$/.test(pathname);
}

export function LearnSidebarStateProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [manualState, setManualState] = useState<boolean | null>(null);
    const isSidebarCollapsed = manualState ?? getDefaultCollapsed(pathname);

    return (
        <LearnSidebarStateContext.Provider
            value={{
                isSidebarCollapsed,
                setSidebarCollapsed: setManualState,
            }}
        >
            {children}
        </LearnSidebarStateContext.Provider>
    );
}

export function useLearnSidebarState() {
    const context = useContext(LearnSidebarStateContext);

    if (!context) {
        throw new Error('useLearnSidebarState must be used within LearnSidebarStateProvider');
    }

    return context;
}
