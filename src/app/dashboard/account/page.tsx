import { getSession } from "@/lib/auth";
import { AccountContent } from "@/components/auth/account-content";
import { AdminLoginForm } from "@/components/auth/login-form";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getUserProgressSnapshot } from "@/lib/user-progress";
import { AccountBackButton } from "./account-back-button";

export const dynamic = "force-dynamic";

const DASHBOARD_TITLE = "\u0054\u00e0\u0069\u0020\u006b\u0068\u006f\u1ea3\u006e\u0020\u0063\u1ee7\u0061\u0020\u0074\u00f4\u0069";
const LOGIN_TITLE = "\u0110\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070";
const LOGIN_DESCRIPTION = "\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0111\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070\u0020\u0111\u1ec3\u0020\u0071\u0075\u1ea3\u006e\u0020\u006c\u00fd\u0020\u0074\u0068\u00f4\u006e\u0067\u0020\u0074\u0069\u006e\u0020\u0076\u00e0\u0020\u0074\u0069\u1ebf\u006e\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u0068\u1ecd\u0063\u0020\u0074\u1ead\u0070\u002e";
const ADMIN_DESCRIPTION = "\u0043\u0068\u00e0\u006f\u0020\u006d\u1eeb\u006e\u0067\u0020\u0071\u0075\u0061\u0079\u0020\u0074\u0072\u1edf\u0020\u006c\u1ea1\u0069\u002c\u0020\u0071\u0075\u1ea3\u006e\u0020\u0074\u0072\u1ecb\u0020\u0068\u1ec7\u0020\u0074\u0068\u1ed1\u006e\u0067\u002e";
const USER_DESCRIPTION_PREFIX = "\u0043\u0068\u00e0\u006f\u0020\u006d\u1eeb\u006e\u0067\u0020\u0071\u0075\u0061\u0079\u0020\u0074\u0072\u1edf\u0020\u006c\u1ea1\u0069\u002c\u0020";

export default async function DashboardAccountPage() {
    const session = await getSession();
    const isAdmin = session?.role === "admin";
    const isAuthenticated = !!session;

    let postCount = 0;
    let memberCount = 0;
    let lessonCount = 0;
    let avgScore = "0";
    let currentLevel = 0;
    let userEmail = "";
    let userDisplayName = "";
    let userBio = "";
    let userLocation = "";
    let userAvatarUrl = "";
    let userJoinedAt = "";

    if (isAuthenticated) {
        try {
            const [postsRes, usersRes, currentUserRes, progressSnapshot] = await Promise.all([
                supabaseAdmin
                    .from("wiki_posts")
                    .select("*", { count: "exact", head: true })
                    .eq("author", session.username),
                supabaseAdmin
                    .from("users")
                    .select("*", { count: "exact", head: true }),
                supabaseAdmin
                    .from("users")
                    .select("email, display_name, bio, location, avatar_url, created_at")
                    .eq("username", session.username)
                    .single(),
                getUserProgressSnapshot(session.username),
            ]);

            postCount = postsRes.count || 0;
            memberCount = usersRes.count || 0;
            userEmail = currentUserRes.data?.email || "";
            userDisplayName = currentUserRes.data?.display_name || "";
            userBio = currentUserRes.data?.bio || "";
            userLocation = currentUserRes.data?.location || "";
            userAvatarUrl = currentUserRes.data?.avatar_url || "";
            userJoinedAt = currentUserRes.data?.created_at || "";
            lessonCount = progressSnapshot.uniqueLessonCount;
            avgScore = progressSnapshot.avgScore.toFixed(1);
            currentLevel = progressSnapshot.experience.level;
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        }
    }

    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">
            <div className="container mx-auto max-w-4xl">
                <div className="flex justify-start">
                    <AccountBackButton />
                </div>
                <div className="text-center space-y-12">
                    <header className="space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        {isAuthenticated ? DASHBOARD_TITLE : LOGIN_TITLE}
                    </h1>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        {!isAuthenticated
                            ? LOGIN_DESCRIPTION
                            : isAdmin
                                ? ADMIN_DESCRIPTION
                                : `${USER_DESCRIPTION_PREFIX}${session.username}!`}
                    </p>
                </header>

                {!isAuthenticated ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AdminLoginForm />
                    </div>
                ) : (
                    <AccountContent
                        session={{
                            ...session,
                            email: userEmail,
                            displayName: userDisplayName,
                            bio: userBio,
                            location: userLocation,
                            avatarUrl: userAvatarUrl,
                            joinedAt: userJoinedAt,
                        }}
                        stats={{ postCount, memberCount, lessonCount, avgScore, currentLevel }}
                    />
                )}
                </div>
            </div>
        </main>
    );
}
