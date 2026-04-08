import Link from 'next/link';
import { getFullLearningTree } from '@/lib/learn-db';
import { isAdminAuthenticated } from '@/lib/auth';
import { LearnSidebar } from '@/components/learn/sidebar';
import { MobileSidebar } from '@/components/learn/mobile-sidebar';
import { LearnSidebarStateProvider } from '@/components/learn/learn-sidebar-state';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface LearnTopLink {
    label: string;
    href: string;
    active?: boolean;
    external?: boolean;
}

const learnTopLinks: LearnTopLink[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tổng quan', href: '/dashboard' },
    { label: 'Học tập', href: '/learn', active: true },
    { label: 'GIthub', href: 'https://github.com/BNam821/ai-coding-guru', external: true },
];

export default async function LearnLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const courses = await getFullLearningTree();
    const isAdmin = await isAdminAuthenticated();

    return (
        <LearnSidebarStateProvider>
            <div className="flex min-h-screen bg-black text-gray-100">
                <LearnSidebar courses={courses} isAdmin={isAdmin} className="hidden md:block" />

                <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                    <header className="sticky top-16 z-40 flex h-14 items-center border-b border-white/10 bg-black/80 px-4 backdrop-blur-md md:hidden">
                        <MobileSidebar courses={courses} isAdmin={isAdmin} />
                        <span className="ml-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-lg font-semibold text-transparent">
                            Học Tập
                        </span>
                    </header>

                    <main className="relative mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 pt-20 md:p-8 md:pt-16">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex md:justify-end">
                                <div className="inline-flex rounded-[2rem] border border-white/10 bg-[#17191f] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:p-3">
                                    <nav className="flex flex-wrap gap-2 sm:gap-3">
                                    {learnTopLinks.map(({ label, href, active, external }) => (
                                        <Link
                                            key={label}
                                            href={href}
                                            aria-current={active ? 'page' : undefined}
                                            target={external ? '_blank' : undefined}
                                            rel={external ? 'noopener noreferrer' : undefined}
                                            className={cn(
                                                'inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:px-5',
                                                active
                                                    ? 'border-[#f4e588]/50 bg-[#f4e588] text-[#151720]'
                                                    : 'border-white/12 bg-white/[0.04] text-white/78 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
                                            )}
                                        >
                                            {label}
                                        </Link>
                                    ))}
                                    </nav>
                                </div>
                            </div>

                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </LearnSidebarStateProvider>
    );
}
