import { getFullLearningTree } from '@/lib/learn-db';
import { getSession } from '@/lib/auth';
import { LearnSidebar } from '@/components/learn/sidebar';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { MobileSidebar } from '@/components/learn/mobile-sidebar';

export default async function LearnLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const courses = await getFullLearningTree();
    const session = await getSession();
    const isAdmin = session?.role === 'admin';

    return (
        <div className="flex min-h-screen bg-black text-gray-100">
            {/* Sidebar Desktop */}
            <LearnSidebar courses={courses} isAdmin={isAdmin} />

            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center h-14 border-b border-white/10 px-4 sticky top-16 bg-black/80 backdrop-blur-md z-40">
                    <MobileSidebar courses={courses} isAdmin={isAdmin} />
                    <span className="ml-4 font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Học Tập
                    </span>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-4xl mx-auto w-full relative">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
                    {children}
                </main>
            </div>
        </div>
    );
}
