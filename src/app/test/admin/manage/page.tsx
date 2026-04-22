"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus,
    Edit2,
    Trash2,
    ArrowLeft,
    Loader2,
    Code2,
    Search,
    AlertCircle
} from "lucide-react";
import { CodingProblem } from "@/lib/coding-problems-service";

export default function AdminManageProblemsPage() {
    const router = useRouter();
    const [problems, setProblems] = useState<CodingProblem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProblems = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/problems");
            if (res.status === 401) {
                router.push("/test");
                return;
            }
            const data = await res.json();
            setProblems(data);
        } catch (error) {
            console.error("Failed to fetch problems:", error);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/problems?id=${deleteId}`, { method: "DELETE" });
            if (res.ok) {
                setProblems(prev => prev.filter(p => p.id !== deleteId));
                setDeleteId(null);
            }
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.language.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <Link
                            href="/test"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft size={16} />
                            Quay lại Test Landing
                        </Link>
                        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <Code2 className="text-yellow-400" size={32} />
                            Quản lý bài tập Code
                        </h1>
                        <p className="text-gray-400">Danh sách bài tập lập trình hiện có trên hệ thống.</p>
                    </div>

                    <Link
                        href="/test/admin/manage/add"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        Thêm bài tập mới
                    </Link>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên bài hoặc ngôn ngữ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-yellow-400/50 backdrop-blur-md transition-all placeholder:text-gray-600"
                    />
                </div>

                <div className="bg-black/20 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-yellow-400" size={40} />
                            <p className="text-gray-500 animate-pulse">Đang tải danh sách bài tập...</p>
                        </div>
                    ) : filteredProblems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Tên bài tập</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400">Ngôn ngữ</th>
                                        <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProblems.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <Link
                                                    href={`/test/code?id=${p.id}`}
                                                    className="font-bold text-white hover:text-yellow-400 transition-colors cursor-pointer group-hover:translate-x-1 inline-block"
                                                >
                                                    {p.title}
                                                </Link>
                                                <div className="text-xs text-gray-500 line-clamp-1 mt-1 opacity-60">{p.description.substring(0, 100)}...</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase text-gray-300 tracking-tighter">
                                                    {p.language}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/test/admin/manage/edit/${p.id}`}
                                                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteId(p.id)}
                                                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-24 text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-2">
                                <Search size={40} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Không tìm thấy bài tập nào</h3>
                            <p className="text-gray-500">Hãy thử đổi từ khóa tìm kiếm hoặc tạo bài tập mới.</p>
                        </div>
                    )}
                </div>
            </div>

            {deleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f0f10] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-scale-in">
                        <div className="flex items-center gap-4 text-red-500 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-2xl">
                                <AlertCircle size={28} />
                            </div>
                            <h2 className="text-2xl font-bold">Xác nhận xóa bài</h2>
                        </div>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Bạn có chắc chắn muốn xóa bài tập này? Hành động này <span className="text-white font-bold">không thể hoàn tác</span> và bài tập sẽ bị gỡ bỏ vĩnh viễn khỏi hệ thống.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Xóa vĩnh viễn"}
                            </button>
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={isDeleting}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 active:scale-95"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
