"use client";

import { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Hash,
    Loader2,
    Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CodingProblem } from "@/lib/coding-problems-service";

interface ProblemFormProps {
    initialData?: CodingProblem | null;
    isEdit?: boolean;
}

type ProblemFormState = {
    title: string;
    language: string;
    description: string;
    skeleton_code: string;
    solution_code: string;
    expected_input: string;
    expected_output: string;
    tags: string[];
    judge0_language_id: string;
    judge0_time_limit_ms: string;
    judge0_memory_limit_kb: string;
};

export function ProblemForm({ initialData, isEdit }: ProblemFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [formData, setFormData] = useState<ProblemFormState>({
        title: "",
        language: "cpp",
        description: "",
        skeleton_code: "",
        solution_code: "",
        expected_input: "",
        expected_output: "",
        tags: [],
        judge0_language_id: "",
        judge0_time_limit_ms: "2000",
        judge0_memory_limit_kb: "128000",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                language: initialData.language,
                description: initialData.description,
                skeleton_code: initialData.skeleton_code,
                solution_code: initialData.solution_code,
                expected_input: initialData.expected_input || "",
                expected_output: initialData.expected_output,
                tags: initialData.tags || [],
                judge0_language_id: initialData.judge0_language_id ? String(initialData.judge0_language_id) : "",
                judge0_time_limit_ms: initialData.judge0_time_limit_ms ? String(initialData.judge0_time_limit_ms) : "2000",
                judge0_memory_limit_kb: initialData.judge0_memory_limit_kb ? String(initialData.judge0_memory_limit_kb) : "128000",
            });
        }

        fetch("/api/admin/tags")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setAvailableTags(data);
                }
            })
            .catch((error) => {
                console.error("Error fetching tags:", error);
            });
    }, [initialData]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        setStatus(null);

        try {
            const method = isEdit ? "PUT" : "POST";
            const payload = isEdit ? { ...formData, id: initialData?.id } : formData;

            const response = await fetch("/api/admin/problems", {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const payloadError = await response.json().catch(() => null);
                throw new Error(payloadError?.error || "Có lỗi xảy ra");
            }

            setStatus({
                type: "success",
                message: isEdit ? "Cập nhật bài tập thành công!" : "Thêm bài tập mới thành công!",
            });

            setTimeout(() => {
                router.push("/test/admin/manage");
                router.refresh();
            }, 1000);
        } catch (error) {
            setStatus({
                type: "error",
                message: error instanceof Error ? error.message : "Có lỗi xảy ra",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tag: string) => {
        setFormData((previous) => {
            const tags = previous.tags.includes(tag)
                ? previous.tags.filter((item) => item !== tag)
                : [...previous.tags, tag];

            return {
                ...previous,
                tags,
            };
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
            <div className="sticky top-28 z-20 flex items-center justify-between gap-4 rounded-2xl border-y border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <Link href="/test/admin/manage" className="rounded-full p-2 transition-colors hover:bg-white/10">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-xl font-bold text-white">
                        {isEdit ? `Đang sửa: ${formData.title}` : "Tạo bài tập mới"}
                    </h2>
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/test/admin/manage"
                        className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-bold transition-all hover:bg-white/5"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-yellow-400 px-8 py-2.5 font-black text-black shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all hover:bg-yellow-300 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Lưu {isEdit ? "thay đổi" : "bài tập"}
                    </button>
                </div>
            </div>

            {status ? (
                <div
                    className={cn(
                        "animate-slide-in flex items-center gap-3 rounded-2xl border p-4",
                        status.type === "success"
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400",
                    )}
                >
                    {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    <span className="font-medium">{status.message}</span>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-6 md:col-span-2">
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Tên bài tập</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(event) => setFormData((previous) => ({ ...previous, title: event.target.value }))}
                            placeholder="VD: Các phép toán cơ bản"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg font-bold text-white outline-none transition-all focus:border-yellow-400/50"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Mô tả đề bài</label>
                        <textarea
                            required
                            rows={10}
                            value={formData.description}
                            onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                            placeholder="Mô tả chi tiết yêu cầu bài học (hỗ trợ Markdown)..."
                            className="custom-scrollbar w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition-all focus:border-yellow-400/50"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Ngôn ngữ</label>
                        <select
                            value={formData.language}
                            onChange={(event) => setFormData((previous) => ({ ...previous, language: event.target.value }))}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold text-white outline-none transition-all focus:border-yellow-400/50"
                        >
                            <option value="cpp" className="bg-[#0f0f10]">C++ (G++ 11)</option>
                            <option value="python" className="bg-[#0f0f10]">Python 3.x</option>
                            <option value="javascript" className="bg-[#0f0f10]">JavaScript (Node.js)</option>
                        </select>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div>
                            <label className="text-sm font-black uppercase tracking-widest text-gray-500">Cấu hình Judge0</label>
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                                Điều chỉnh language id và giới hạn chạy khi sinh test case hoặc chấm bài. Nếu để trống language id, hệ thống sẽ tự lấy mặc định theo ngôn ngữ.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Judge0 language id (tùy chọn)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.judge0_language_id}
                                onChange={(event) => setFormData((previous) => ({ ...previous, judge0_language_id: event.target.value }))}
                                placeholder="VD: 54 cho C++, 71 cho Python, 63 cho Node.js"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white outline-none transition-all focus:border-yellow-400/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Giới hạn thời gian (ms)</label>
                                <input
                                    type="number"
                                    min="500"
                                    step="100"
                                    value={formData.judge0_time_limit_ms}
                                    onChange={(event) => setFormData((previous) => ({ ...previous, judge0_time_limit_ms: event.target.value }))}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white outline-none transition-all focus:border-yellow-400/50"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Giới hạn bộ nhớ (KB)</label>
                                <input
                                    type="number"
                                    min="32000"
                                    step="1000"
                                    value={formData.judge0_memory_limit_kb}
                                    onChange={(event) => setFormData((previous) => ({ ...previous, judge0_memory_limit_kb: event.target.value }))}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white outline-none transition-all focus:border-yellow-400/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Input mẫu</label>
                        <textarea
                            rows={4}
                            value={formData.expected_input}
                            onChange={(event) => setFormData((previous) => ({ ...previous, expected_input: event.target.value }))}
                            placeholder="Dữ liệu truyền vào stdin (nếu có)..."
                            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-mono text-xs text-white outline-none transition-all focus:border-yellow-400/50"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Output mong muốn</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.expected_output}
                            onChange={(event) => setFormData((previous) => ({ ...previous, expected_output: event.target.value }))}
                            placeholder="Dữ liệu in ra stdout mong đợi..."
                            className="w-full resize-none rounded-2xl border border-white/10 border-yellow-400/20 bg-white/5 px-5 py-4 font-mono text-xs text-white outline-none transition-all focus:border-yellow-400/50"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-500">
                            <Hash size={16} /> Tags (chọn từ bài học)
                        </label>
                        <div className="flex flex-wrap gap-2 p-1">
                            {availableTags.length > 0 ? (
                                availableTags.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "rounded-lg border px-3 py-1.5 text-xs font-bold transition-all",
                                            formData.tags.includes(tag)
                                                ? "border-yellow-500 bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                                                : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10",
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))
                            ) : (
                                <p className="text-[10px] italic text-gray-600">Chưa có tag nào được định nghĩa trong bài học.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Skeleton code (mồi)</label>
                        <span className="rounded bg-white/5 px-2 py-1 text-[10px] text-gray-600">Chứa cấu trúc ban đầu</span>
                    </div>
                    <div className="h-[400px] overflow-hidden rounded-2xl border border-white/10">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={formData.language === "python" ? "python" : formData.language === "javascript" ? "javascript" : "cpp"}
                            value={formData.skeleton_code}
                            onChange={(value) => setFormData((previous) => ({ ...previous, skeleton_code: value || "" }))}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20, bottom: 20 },
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Solution code (giải)</label>
                        <span className="rounded bg-green-500/5 px-2 py-1 text-[10px] font-bold uppercase text-green-600/50">Đáp án chuẩn 100đ</span>
                    </div>
                    <div className="h-[400px] overflow-hidden rounded-2xl border border-white/10">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={formData.language === "python" ? "python" : formData.language === "javascript" ? "javascript" : "cpp"}
                            value={formData.solution_code}
                            onChange={(value) => setFormData((previous) => ({ ...previous, solution_code: value || "" }))}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20, bottom: 20 },
                            }}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
