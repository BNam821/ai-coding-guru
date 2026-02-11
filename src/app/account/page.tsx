import { isAdminAuthenticated, getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/auth/login-form";
import { AccountContent } from "@/components/auth/account-content";
import { supabase } from "@/lib/supabase";

export default async function AccountPage() {
    const session = await getSession();
    const isAdmin = session?.role === "admin";
    const isAuthenticated = !!session;

    let postCount = 0;
    let memberCount = 0;
    let userEmail = "";
    let userDisplayName = "";

    if (isAuthenticated) {
        try {
            const [postsRes, usersRes, currentUserRes] = await Promise.all([
                supabase
                    .from("wiki_posts")
                    .select("*", { count: 'exact', head: true })
                    .eq("author", session.username),
                supabase
                    .from("users")
                    .select("*", { count: 'exact', head: true }),
                supabase
                    .from("users")
                    .select("email, display_name")
                    .eq("username", session.username)
                    .single()
            ]);

            postCount = postsRes.count || 0;
            memberCount = usersRes.count || 0;
            userEmail = currentUserRes.data?.email || "";
            userDisplayName = currentUserRes.data?.display_name || "";
        } catch (error) {
            console.error("Failed to fetch account stats:", error);
        }
    }

    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">

            <div className="container mx-auto text-center space-y-12 max-w-4xl">
                <header className="space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        {isAuthenticated ? "Tài khoản của tôi" : "Đăng nhập"}
                    </h1>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        {!isAuthenticated
                            ? "Vui lòng đăng nhập để quản lý thông tin và tiến trình học tập."
                            : isAdmin
                                ? "Chào mừng quay trở lại, quản trị hệ thống."
                                : `Chào mừng quay trở lại, ${session.username}!`}
                    </p>
                </header>

                {!isAuthenticated ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AdminLoginForm />
                    </div>
                ) : (
                    <AccountContent
                        session={{ ...session, email: userEmail, displayName: userDisplayName }}
                        stats={{ postCount, memberCount }}
                    />
                )}
            </div>
        </main>
    );
}
