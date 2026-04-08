import { getFullLearningTree } from '@/lib/learn-db';
import { isAdminAuthenticated } from '@/lib/auth';
import { LearnSidebar } from '@/components/learn/sidebar';
import { MobileSidebar } from '@/components/learn/mobile-sidebar';
import { LearnSidebarStateProvider } from '@/components/learn/learn-sidebar-state';

export const dynamic = 'force-dynamic';

export default async function LearnLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const courses = await getFullLearningTree();
    const isAdmin = await isAdminAuthenticated();

    return (
        <LearnSidebarStateProvider>
            <div className="relative flex min-h-screen bg-transparent text-gray-100">
                {/* Sidebar Desktop */}
                <LearnSidebar courses={courses} isAdmin={isAdmin} className="hidden md:block" />

                <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                    {/* Mobile Header */}
                    <header className="md:hidden flex items-center h-14 border-b border-white/10 px-4 sticky top-16 bg-black/55 backdrop-blur-md z-40">
                        <MobileSidebar courses={courses} isAdmin={isAdmin} />
                        <span className="ml-4 font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            Học Tập
                        </span>
                    </header>

                    {/* Main Content */}
                    <main className="relative mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 pt-24 md:p-8 md:pt-28">
                        <div className="absolute inset-0 rounded-[2rem] bg-black/25 pointer-events-none" />
                        <div className="absolute inset-0 rounded-[2rem] bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
                        <div className="relative z-10">{children}</div>
                    </main>
                </div>
            </div>
        </LearnSidebarStateProvider>
    );
}
