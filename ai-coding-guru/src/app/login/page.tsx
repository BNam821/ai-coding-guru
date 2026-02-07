import { LoginForm } from "@/components/auth/login-form";
import { PageBackground } from "@/components/ui/page-background";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await getSession();

    // Nếu đã đăng nhập thì chuyển hướng về account
    if (session) {
        redirect("/account");
    }

    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">
            <div className="container mx-auto max-w-4xl text-center space-y-8">
                <header className="space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">Đăng nhập</h1>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        Chào mừng bạn quay trở lại với AI Coding Guru
                    </p>
                </header>
                <LoginForm />
            </div>
        </main>
    );
}
