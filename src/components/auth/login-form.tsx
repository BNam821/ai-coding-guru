"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { Lock, User, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [adminKey, setAdminKey] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // Logic click 5 lần trong 2 giây
    const clickTimes = useRef<number[]>([]);

    const handleEyeClick = () => {
        setShowPassword(!showPassword);

        const now = Date.now();
        clickTimes.current.push(now);

        // Chỉ giữ 5 lần click gần nhất
        if (clickTimes.current.length > 5) {
            clickTimes.current.shift();
        }

        if (clickTimes.current.length === 5) {
            const firstClick = clickTimes.current[0];
            if (now - firstClick <= 2000) {
                setShowAdminKey(true);
                // Reset click times sau khi đã hiện
                clickTimes.current = [];
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, adminKey: showAdminKey ? adminKey : undefined }),
            });

            const data = await res.json();
            if (data.success) {
                router.refresh(); // Refresh để Server Component nhận diện session mới
                router.push("/account");
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
        <GlassCard className="p-8 border-white/10 shadow-2xl max-w-md mx-auto">
            <form onSubmit={handleLogin} className="space-y-6 text-left">
                <header className="text-center mb-8 space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Đăng nhập</h2>
                    <p className="text-white/60 text-sm">Chào mừng bạn quay trở lại</p>
                </header>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white ml-1">Tài khoản / Email</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all"
                            placeholder="Nhập username hoặc email"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white ml-1">Mật khẩu</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-accent-primary/50 transition-all"
                            placeholder="Nhập mật khẩu"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleEyeClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {showAdminKey && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-sm font-medium text-accent-secondary ml-1 flex items-center gap-2">
                            <ShieldAlert size={14} /> Secret Key (Admin)
                        </label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                className="w-full bg-accent-secondary/5 border border-accent-secondary/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent-secondary transition-all"
                                placeholder="Nhập mã bí mật"
                                required
                            />
                        </div>
                    </div>
                )}

                <NeonButton
                    type="submit"
                    variant="primary"
                    className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? "Đang xử lý..." : "Đăng nhập ngay"}
                </NeonButton>

                <p className="text-center text-white/40 text-sm">
                    Chưa có tài khoản?{" "}
                    <Link href="/signup" className="text-accent-secondary hover:underline cursor-pointer">
                        Đăng ký
                    </Link>
                </p>
            </form>
        </GlassCard>
    );
}

// Giữ lại tên AdminLoginForm để không lỗi các chỗ đang import
export const AdminLoginForm = LoginForm;
