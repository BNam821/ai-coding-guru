import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const LOGIN_TITLE = "\u0110\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070";
const LOGIN_DESCRIPTION = "\u0043\u0068\u00e0\u006f\u0020\u006d\u1eeb\u006e\u0067\u0020\u0062\u1ea1\u006e\u0020\u0071\u0075\u0061\u0079\u0020\u0074\u0072\u1edf\u0020\u006c\u1ea1\u0069\u0020\u0076\u1edb\u0069\u0020\u0041\u0049\u0020\u0043\u006f\u0064\u0069\u006e\u0067\u0020\u0047\u0075\u0072\u0075";

export default async function LoginPage() {
    const session = await getSession();

    if (session) {
        redirect("/dashboard");
    }

    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">
            <div className="container mx-auto max-w-4xl text-center space-y-8">
                <header className="space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{LOGIN_TITLE}</h1>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        {LOGIN_DESCRIPTION}
                    </p>
                </header>
                <LoginForm />
            </div>
        </main>
    );
}
