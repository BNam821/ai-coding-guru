import { AccountContent } from "@/components/auth/account-content";
import { BackButton } from "@/components/ui/back-button";
import { supabase } from "@/lib/supabase";
import { getUserProgressSnapshot } from "@/lib/user-progress";
import { notFound } from "next/navigation";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const { username } = await params;

    let postCount = 0;
    let memberCount = 0;
    let lessonCount = 0;
    let avgScore = "0";
    let currentLevel = 0;
    let userData: any = null;

    try {
        const targetUserRes = await supabase
            .from("users")
            .select("username, email, display_name, bio, location, avatar_url, created_at")
            .eq("username", username)
            .single();

        if (targetUserRes.error) {
            console.error("Supabase error fetching user:", targetUserRes.error);
            return notFound();
        }

        if (!targetUserRes.data) {
            return notFound();
        }

        const maskEmail = (email: string) => {
            if (!email || !email.includes("@")) return email;
            const [localPart, domain] = email.split("@");
            if (localPart.length <= 1) return `*@${domain}`;
            return `${localPart[0]}****@${domain}`;
        };

        const rawUserData = targetUserRes.data;
        userData = {
            ...rawUserData,
            email: maskEmail(rawUserData.email),
            role: "admin"
        };
        const actualUsername = userData.username;

        const [postsRes, usersRes, progressRes] = await Promise.allSettled([
            supabase
                .from("wiki_posts")
                .select("*", { count: "exact", head: true })
                .eq("author", actualUsername),
            supabase
                .from("users")
                .select("*", { count: "exact", head: true }),
            getUserProgressSnapshot(actualUsername),
        ]);

        postCount = (postsRes.status === "fulfilled" && postsRes.value.count) || 0;
        memberCount = (usersRes.status === "fulfilled" && usersRes.value.count) || 0;
        if (progressRes.status === "fulfilled") {
            lessonCount = progressRes.value.uniqueLessonCount;
            avgScore = progressRes.value.avgScore.toFixed(1);
            currentLevel = progressRes.value.experience.level;
        }
    } catch (error) {
        console.error("Failed to fetch profile data:", error);
        return notFound();
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="container mx-auto max-w-4xl space-y-12">
                <div className="flex justify-start">
                    <BackButton />
                </div>

                <header className="space-y-4 text-center">
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
                        avatarUrl: userData.avatar_url,
                        joinedAt: userData.created_at
                    }}
                    stats={{ postCount, memberCount, lessonCount, avgScore, currentLevel }}
                    isReadOnly={true}
                />
            </div>
        </main>
    );
}
