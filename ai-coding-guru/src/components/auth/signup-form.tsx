"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { Lock, User, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <GlassCard className="p-8 border-white/10 shadow-2xl max-w-md mx-auto text-center space-y-4">
                <div className="text-accent-secondary text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-white">Đăng ký thành công!</h2>
                <p className="text-white/60">Đang chuyển hướng đến trang đăng nhập...</p>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-8 border-white/10 shadow-2xl max-w-md mx-auto">
            <form onSubmit={handleSignup} className="space-y-4 text-left">
                <header className="text-center mb-6 space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Tạo tài khoản</h2>
                    <p className="text-white/60 text-sm">Tham gia cùng cộng đồng AI Guru</p>
                </header>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-white ml-1">Tên đăng nhập</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all"
                            placeholder="username123"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-white ml-1">Email</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all"
                            placeholder="example@gmail.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
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
                            placeholder="••••••••"
                            required
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

                <div className="space-y-1">
                    <label className="text-sm font-medium text-white ml-1">Xác nhận mật khẩu</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-accent-primary/50 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <NeonButton
                    type="submit"
                    variant="primary"
                    className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                    disabled={isLoading}
                >
                    {isLoading ? "Đang xử lý..." : "Đăng ký ngay"}
                </NeonButton>

                <p className="text-center text-white/40 text-sm mt-4">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-accent-secondary hover:underline cursor-pointer">
                        Đăng nhập
                    </Link>
                </p>
            </form>
        </GlassCard>
    );
}
