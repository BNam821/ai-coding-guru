"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldAlert, User } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";

const LOGIN_TITLE = "\u0110\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070";
const LOGIN_SUBTITLE = "\u0043\u0068\u00e0\u006f\u0020\u006d\u1eeb\u006e\u0067\u0020\u0062\u1ea1\u006e\u0020\u0071\u0075\u0061\u0079\u0020\u0074\u0072\u1edf\u0020\u006c\u1ea1\u0069";
const ACCOUNT_LABEL = "\u0054\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e\u0020\u002f\u0020\u0045\u006d\u0061\u0069\u006c";
const ACCOUNT_PLACEHOLDER = "\u004e\u0068\u1ead\u0070\u0020\u0075\u0073\u0065\u0072\u006e\u0061\u006d\u0065\u0020\u0068\u006f\u1eb7\u0063\u0020\u0065\u006d\u0061\u0069\u006c";
const PASSWORD_LABEL = "\u004d\u1ead\u0074\u0020\u006b\u0068\u1ea9\u0075";
const PASSWORD_PLACEHOLDER = "\u004e\u0068\u1ead\u0070\u0020\u006d\u1ead\u0074\u0020\u006b\u0068\u1ea9\u0075";
const ADMIN_KEY_PLACEHOLDER = "\u004e\u0068\u1ead\u0070\u0020\u006d\u00e3\u0020\u0062\u00ed\u0020\u006d\u1ead\u0074";
const LOGIN_ERROR = "\u0110\u00e3\u0020\u0063\u00f3\u0020\u006c\u1ed7\u0069\u0020\u0078\u1ea3\u0079\u0020\u0072\u0061\u002e\u0020\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0074\u0068\u1eed\u0020\u006c\u1ea1\u0069\u002e";
const LOGIN_BUTTON = "\u0110\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070\u0020\u006e\u0067\u0061\u0079";
const LOGIN_LOADING = "\u0110\u0061\u006e\u0067\u0020\u0078\u1eed\u0020\u006c\u00fd\u002e\u002e\u002e";
const SIGNUP_PROMPT = "\u0043\u0068\u01b0\u0061\u0020\u0063\u00f3\u0020\u0074\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e\u003f";
const SIGNUP_LABEL = "\u0110\u0103\u006e\u0067\u0020\u006b\u00fd";

export function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [adminKey, setAdminKey] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const clickTimes = useRef<number[]>([]);

    const handleEyeClick = () => {
        setShowPassword(!showPassword);

        const now = Date.now();
        clickTimes.current.push(now);

        if (clickTimes.current.length > 5) {
            clickTimes.current.shift();
        }

        if (clickTimes.current.length === 5) {
            const firstClick = clickTimes.current[0];
            if (now - firstClick <= 2000) {
                setShowAdminKey(true);
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
                router.refresh();
                router.push("/dashboard");
            } else {
                setError(data.error);
            }
        } catch {
            setError(LOGIN_ERROR);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassCard className="mx-auto max-w-md border-white/10 p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6 text-left">
                <header className="mb-8 space-y-2 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white">{LOGIN_TITLE}</h2>
                    <p className="text-sm text-white/60">{LOGIN_SUBTITLE}</p>
                </header>

                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-500">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-white">{ACCOUNT_LABEL}</label>
                    <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white transition-all focus:border-accent-primary/50 focus:outline-none"
                            placeholder={ACCOUNT_PLACEHOLDER}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="ml-1 text-sm font-medium text-white">{PASSWORD_LABEL}</label>
                    <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-accent-primary">
                            <Lock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-white transition-all focus:border-accent-primary/50 focus:outline-none"
                            placeholder={PASSWORD_PLACEHOLDER}
                            required
                        />
                        <button
                            type="button"
                            onClick={handleEyeClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {showAdminKey && (
                    <div className="animate-in slide-in-from-top-2 fade-in space-y-2 duration-300">
                        <label className="ml-1 flex items-center gap-2 text-sm font-medium text-accent-secondary">
                            <ShieldAlert size={14} /> Secret Key (Admin)
                        </label>
                        <div className="group relative">
                            <input
                                type="password"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                className="w-full rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 px-4 py-3 text-white transition-all focus:border-accent-secondary focus:outline-none"
                                placeholder={ADMIN_KEY_PLACEHOLDER}
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-center">
                    <NeonButton
                        type="submit"
                        variant="primary"
                        className="min-w-[220px] rounded-xl py-4 font-bold"
                        disabled={isLoading}
                    >
                        {isLoading ? LOGIN_LOADING : LOGIN_BUTTON}
                    </NeonButton>
                </div>

                <p className="text-center text-sm text-white/40">
                    {SIGNUP_PROMPT}{" "}
                    <Link href="/signup" className="cursor-pointer text-accent-secondary hover:underline">
                        {SIGNUP_LABEL}
                    </Link>
                </p>
            </form>
        </GlassCard>
    );
}

export const AdminLoginForm = LoginForm;
