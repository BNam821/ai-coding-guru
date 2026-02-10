import { LoadingScreen } from "@/components/ui/loading-screen";

/**
 * Global loading state for Next.js App Router.
 * Displayed automatically during route transitions and data fetching.
 */
export default function Loading() {
    return <LoadingScreen fullScreen />;
}
