"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import { ProblemTestManager } from "@/components/admin/problem-test-manager";
import { CodingProblem } from "@/lib/coding-problems-service";
import { Loader2, AlertCircle } from "lucide-react";

export default function AdminEditProblemPage() {
    const params = useParams();
    const router = useRouter();
    const [problem, setProblem] = useState<CodingProblem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = params.id;
        if (!id) return;

        const fetchProblem = async () => {
            try {
                const res = await fetch("/api/admin/problems");
                if (res.status === 401) {
                    router.push("/test");
                    return;
                }
                const data: CodingProblem[] = await res.json();
                const found = data.find(p => p.id === id);

                if (found) {
                    setProblem(found);
                } else {
                    setError("Không tìm thấy bài tập này.");
                }
            } catch {
                setError("Lỗi khi tải dữ liệu bài tập.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProblem();
    }, [params.id, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-yellow-400" size={48} />
                <p className="text-gray-500">Đang tải dữ liệu bài tập...</p>
            </div>
        );
    }

    if (error || !problem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20">
                    <AlertCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-white">{error || "Sự cố không xác định"}</h2>
                <button
                    onClick={() => router.push("/test/admin/manage")}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all font-bold"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px] -z-10" />

            <div className="max-w-6xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                        Chỉnh sửa <span className="text-blue-400">bài tập</span>
                    </h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        Cập nhật nội dung, logic chấm điểm hoặc mồi code cho thử thách hiện có.
                    </p>
                </div>

                <ProblemForm initialData={problem} isEdit={true} />
                <ProblemTestManager problemId={problem.id} />
            </div>
        </main>
    );
}
