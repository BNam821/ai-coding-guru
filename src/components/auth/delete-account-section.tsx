"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Trash2, AlertTriangle, Lock, Eye, EyeOff, X } from "lucide-react";

export function DeleteAccountSection() {
    const [isConfirming, setIsConfirming] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();
            if (data.success) {
                router.push("/");
                router.refresh();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-12 space-y-4">
            <h3 className="text-xl font-bold text-red-500 flex items-center gap-2 px-1">
                <AlertTriangle size={20} />
                Khu vực nguy hiểm
            </h3>

            <GlassCard className="p-6 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                {!isConfirming ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-white">Xóa tài khoản vĩnh viễn</h4>
                            <p className="text-white/40 text-sm">
                                Hành động này không phải là hành động tạm thời. Toàn bộ thứ hiển thị, tiến trình học tập và dấu vết của bạn sẽ bị xóa bỏ hoàn toàn.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsConfirming(true)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl transition-all font-bold whitespace-nowrap"
                        >
                            Xóa tài khoản
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold text-red-500 uppercase tracking-widest">Xác nhận xóa tài khoản</h4>
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm">
                            <p className="font-bold flex items-center gap-2 mb-1">
                                <AlertTriangle size={16} /> Cảnh báo!
                            </p>
                            Hành động này không thể hoàn tác. Vui lòng nhập mật khẩu của bạn để xác nhận phải là bạn.
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleDelete} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-white/50 ml-1 uppercase">Mật khẩu của bạn</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-red-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-red-500/50 transition-all"
                                        placeholder="••••••••"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
                                >
                                    <Trash2 size={18} />
                                    {isLoading ? "Đang xóa..." : "Tôi hiểu rồi, xóa ngay!"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsConfirming(false)}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all text-sm font-medium"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
