import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpenCheck, ChevronRight, Code2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getAllCodingProblems } from "@/lib/coding-problems-service";

export default async function CodeProblemListPage() {
    const session = await getSession();

    if (!session?.username) {
        redirect("/login");
    }

    if (session.role === "admin") {
        redirect("/test/admin/manage");
    }

    const problems = await getAllCodingProblems();

    return (
        <main className="min-h-screen px-4 pb-20 pt-32 relative z-10">
            <div className="absolute inset-0 bg-deep-space -z-20" />
            <div className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[140px] -z-10" />
            <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-yellow-400/10 blur-[140px] -z-10" />

            <div className="mx-auto max-w-5xl space-y-8">
                <div className="space-y-4">
                    <Link
                        href="/test"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Quay lại trang kiểm tra
                    </Link>

                    <div className="rounded-[2rem] border border-cyan-400/20 bg-black/40 p-6 backdrop-blur-xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                            <BookOpenCheck size={14} />
                            Danh sách bài tập
                        </div>
                        <h1 className="mt-4 flex items-center gap-3 text-4xl font-black tracking-tight text-white md:text-5xl">
                            <Code2 className="text-cyan-300" size={34} />
                            Danh sách bài tập theo dõi
                        </h1>
                    </div>
                </div>

                <div className="grid gap-4">
                    {problems.map((problem, index) => (
                        <Link
                            key={problem.id}
                            href={`/test/code?id=${problem.id}`}
                            className="group rounded-[1.75rem] border border-white/10 bg-black/35 p-6 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/5 px-3 text-xs font-black text-gray-300">
                                            {index + 1}
                                        </span>
                                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                                            {problem.language === "cpp" ? "C++" : problem.language.toUpperCase()}
                                        </span>
                                        {problem.tags && problem.tags.length > 0 && (
                                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-100">
                                                {problem.tags.slice(0, 3).join(" • ")}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-white transition-colors group-hover:text-cyan-100">
                                            {problem.title}
                                        </h2>
                                        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-gray-400">
                                            {problem.description.replace(/[#*_`>-]/g, " ").replace(/\s+/g, " ").trim()}
                                        </p>
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80 transition-all group-hover:border-cyan-300/40 group-hover:bg-cyan-300/10 group-hover:text-cyan-100">
                                    Vào bài
                                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
