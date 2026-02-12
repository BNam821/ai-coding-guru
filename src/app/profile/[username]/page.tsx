import { AccountContent } from "@/components/auth/account-content";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const { username } = await params;

    let postCount = 0;
    let memberCount = 0;
    let lessonCount = 0;
    let avgScore = "0";
    let userData: any = null;

    try {
        // 1. Fetch user data first (Essential)
        const targetUserRes = await supabase
            .from("users")
            .select("username, display_name, bio, location, avatar_url")
            .eq("username", username)
            .single();

        if (targetUserRes.error) {
            console.error("Supabase error fetching user:", targetUserRes.error);
            return notFound();
        }

        if (!targetUserRes.data) {
            return notFound();
        }

        userData = { ...targetUserRes.data, role: "admin" }; // Default to admin per user request
        const actualUsername = userData.username; // Use the exact username from DB for other queries

        // 2. Fetch stats (Non-essential, handle errors gracefully)
        const [postsRes, usersRes, historyRes, scoresRes] = await Promise.allSettled([
            supabase
                .from("wiki_posts")
                .select("*", { count: 'exact', head: true })
                .eq("author", actualUsername),
            supabase
                .from("users")
                .select("*", { count: 'exact', head: true }),
            supabase
                .from("user_learning_history")
                .select("lesson_slug", { count: 'exact' })
                .eq("username", actualUsername),
            supabase
                .from("quiz_scores")
                .select("score")
                .eq("username", actualUsername)
        ]);

        postCount = (postsRes.status === 'fulfilled' && postsRes.value.count) || 0;
        memberCount = (usersRes.status === 'fulfilled' && usersRes.value.count) || 0;
        lessonCount = (historyRes.status === 'fulfilled' && historyRes.value.count) || 0;

        if (scoresRes.status === 'fulfilled' && scoresRes.value.data && scoresRes.value.data.length > 0) {
            const total = scoresRes.value.data.reduce((acc, curr: any) => acc + curr.score, 0);
            avgScore = (total / scoresRes.value.data.length).toFixed(1);
        }
    } catch (error) {
        console.error("Failed to fetch profile data:", error);
        return notFound();
    }

    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">
            <div className="container mx-auto text-center space-y-12 max-w-4xl">
                <header className="space-y-4">
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Hồ sơ tác giả
                    </h1>
                    <p className="text-white/60 text-lg max-w-xl mx-auto">
                        Thông tin chi tiết và thành tựu của {userData.display_name || userData.username}.
                    </p>
                </header>

                <AccountContent
                    session={{
                        username: userData.username,
                        role: userData.role,
                        email: userData.email,
                        displayName: userData.display_name,
                        bio: userData.bio,
                        location: userData.location,
                        avatarUrl: userData.avatar_url
                    }}
                    stats={{ postCount, memberCount, lessonCount, avgScore }}
                    isReadOnly={true}
                />
            </div>
        </main>
    );
}
