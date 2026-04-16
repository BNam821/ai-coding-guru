"use client";

import { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { 
    Save, 
    X, 
    Loader2, 
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Hash,
    Tag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CodingProblem } from "@/lib/coding-problems-service";

interface ProblemFormProps {
    initialData?: CodingProblem | null;
    isEdit?: boolean;
}

export function ProblemForm({ initialData, isEdit }: ProblemFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        language: "cpp",
        description: "",
        skeleton_code: "",
        solution_code: "",
        expected_input: "",
        expected_output: "",
        tags: [] as string[],
    });
    const [availableTags, setAvailableTags] = useState<string[]>([]);

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
            });
        }

        // Fetch available tags from lessons
        fetch("/api/admin/tags")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableTags(data);
            })
            .catch(err => console.error("Error fetching tags:", err));
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);

        try {
            const method = isEdit ? "PUT" : "POST";
            const payload = isEdit ? { ...formData, id: initialData?.id } : formData;

            const res = await fetch("/api/admin/problems", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Có lỗi xảy ra");
            }

            setStatus({ 
                type: "success", 
                message: isEdit ? "Cấu nhật bài tập thành công!" : "Thêm bài tập mới thành công!" 
            });
            
            setTimeout(() => {
                router.push("/test/admin/manage");
                router.refresh();
            }, 1000);
        } catch (error: any) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => {
            const tags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags };
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4 sticky top-28 z-20 py-4 bg-black/60 backdrop-blur-xl border-y border-white/10 px-6 rounded-2xl">
                <div className="flex items-center gap-4">
                    <Link href="/test/admin/manage" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h2 className="text-xl font-bold text-white">
                        {isEdit ? `Đang sửa: ${formData.title}` : "Tạo bài tập mới"}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <Link 
                        href="/test/admin/manage"
                        className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold text-sm"
                    >
                        Hủy
                    </Link>
                    <button 
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Lưu {isEdit ? "Thay đổi" : "Bài tập"}
                    </button>
                </div>
            </div>

            {/* Status Messages */}
            {status && (
                <div className={cn(
                    "p-4 rounded-2xl border flex items-center gap-3 animate-slide-in",
                    status.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                )}>
                    {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            {/* Basic Info Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Tên bài tập</label>
                        <input 
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="VD: Các phép toán cơ bản"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-yellow-400/50 outline-none transition-all text-lg font-bold"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Mô tả đề bài</label>
                        <textarea 
                            required
                            rows={10}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Mô tả chi tiết yêu cầu bài học (Hỗ trợ Markdown)..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-yellow-400/50 outline-none transition-all resize-none custom-scrollbar"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Ngôn ngữ</label>
                        <select 
                            value={formData.language}
                            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-yellow-400/50 outline-none transition-all appearance-none font-bold"
                        >
                            <option value="cpp" className="bg-[#0f0f10]">C++ (G++ 11)</option>
                            <option value="python" className="bg-[#0f0f10]">Python 3.x</option>
                            <option value="javascript" className="bg-[#0f0f10]">JavaScript (Node.js)</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Input mẫu</label>
                        <textarea 
                            rows={4}
                            value={formData.expected_input}
                            onChange={(e) => setFormData(prev => ({ ...prev, expected_input: e.target.value }))}
                            placeholder="Dữ liệu truyền vào stdin (nếu có)..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-yellow-400/50 outline-none transition-all resize-none text-xs font-mono"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Output mong muốn</label>
                        <textarea 
                            required
                            rows={4}
                            value={formData.expected_output}
                            onChange={(e) => setFormData(prev => ({ ...prev, expected_output: e.target.value }))}
                            placeholder="Dữ liệu in ra stdout mong đợi..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-yellow-400/50 outline-none transition-all resize-none text-xs font-mono border-yellow-400/20"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <Hash size={16} /> Tags (Chọn từ bài học)
                        </label>
                        <div className="flex flex-wrap gap-2 p-1">
                            {availableTags.length > 0 ? (
                                availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                            formData.tags.includes(tag)
                                                ? "bg-yellow-400 border-yellow-500 text-black shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))
                            ) : (
                                <p className="text-[10px] text-gray-600 italic">Chưa có tag nào được định nghĩa trong bài học.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Code Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Skeleton Code (Mồi)</label>
                        <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-1 rounded">Chứa cấu trúc ban đầu</span>
                    </div>
                    <div className="border border-white/10 rounded-2xl overflow-hidden h-[400px]">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={formData.language === "python" ? "python" : "cpp"}
                            value={formData.skeleton_code}
                            onChange={(val) => setFormData(prev => ({ ...prev, skeleton_code: val || "" }))}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20, bottom: 20 }
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black uppercase tracking-widest text-gray-500">Solution Code (Giải)</label>
                        <span className="text-[10px] text-green-600/50 bg-green-500/5 px-2 py-1 rounded uppercase font-bold">Đáp án chuẩn 100đ</span>
                    </div>
                    <div className="border border-white/10 rounded-2xl overflow-hidden h-[400px]">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={formData.language === "python" ? "python" : "cpp"}
                            value={formData.solution_code}
                            onChange={(val) => setFormData(prev => ({ ...prev, solution_code: val || "" }))}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20, bottom: 20 }
                            }}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
