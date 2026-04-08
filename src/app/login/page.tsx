import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ redirect?: string }>;
}) {
    const session = await getSession();
    const { redirect: redirectTarget } = await searchParams;

    if (session) {
        redirect(redirectTarget || "/dashboard");
    }

    return (
        <main className="relative z-10 min-h-screen px-4 pt-32">
            <div className="container mx-auto max-w-4xl space-y-8 text-center">
                <header className="space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Đăng nhập</h1>
                    <p className="mx-auto max-w-xl text-lg text-white/60">
                        Chào mừng bạn quay trở lại với AI Coding Guru
                    </p>
                </header>
                <LoginForm />
            </div>
        </main>
    );
}
