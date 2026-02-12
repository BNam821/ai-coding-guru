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
        const [postsRes, usersRes, targetUserRes, historyRes, scoresRes] = await Promise.all([
            supabase
                .from("wiki_posts")
                .select("*", { count: 'exact', head: true })
                .eq("author", username),
            supabase
                .from("users")
                .select("*", { count: 'exact', head: true }),
            supabase
                .from("users")
                .select("username, role, email, display_name, bio, location, avatar_url")
                .eq("username", username)
                .single(),
            supabase
                .from("user_learning_history")
                .select("lesson_slug", { count: 'exact' })
                .eq("username", username),
            supabase
                .from("quiz_scores")
                .select("score")
                .eq("username", username)
        ]);

        if (!targetUserRes.data) {
            return notFound();
        }

        userData = targetUserRes.data;
        postCount = postsRes.count || 0;
        memberCount = usersRes.count || 0;
        lessonCount = historyRes.count || 0;

        if (scoresRes.data && scoresRes.data.length > 0) {
            const total = scoresRes.data.reduce((acc, curr) => acc + curr.score, 0);
            avgScore = (total / scoresRes.data.length).toFixed(1);
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
