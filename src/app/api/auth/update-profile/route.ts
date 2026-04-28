import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createUserSession, getSession } from "@/lib/auth";
import { normalizeOptionalHttpUrl } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Báº¡n cáº§n Ä‘Äƒng nháº­p" }, { status: 401 });
        }

        const {
            displayName,
            email,
            bio,
            avatarUrl,
            location,
            newPassword,
            oldPassword,
        } = await req.json();

        const normalizedDisplayName = typeof displayName === "string" ? displayName.trim().slice(0, 80) : "";
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const normalizedBio = typeof bio === "string" ? bio.trim().slice(0, 500) : "";
        const normalizedAvatarUrl = normalizeOptionalHttpUrl(avatarUrl, { allowRelative: true });
        const normalizedLocation = typeof location === "string" ? location.trim().slice(0, 120) : "";
        const normalizedNewPassword = typeof newPassword === "string" ? newPassword : "";
        const normalizedOldPassword = typeof oldPassword === "string" ? oldPassword : "";

        if (!SIMPLE_EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 254) {
            return NextResponse.json({ success: false, error: "Email khÃ´ng há»£p lá»‡" }, { status: 400 });
        }

        if (!normalizedOldPassword) {
            return NextResponse.json({ success: false, error: "Máº­t kháº©u cÅ© lÃ  báº¯t buá»™c" }, { status: 400 });
        }

        if (newPassword && (normalizedNewPassword.length < 8 || normalizedNewPassword.length > 128)) {
            return NextResponse.json({ success: false, error: "Máº­t kháº©u má»›i pháº£i tá»« 8 Ä‘áº¿n 128 kÃ½ tá»±" }, { status: 400 });
        }

        if (avatarUrl && !normalizedAvatarUrl) {
            return NextResponse.json({ success: false, error: "Avatar URL khÃ´ng há»£p lá»‡" }, { status: 400 });
        }

        const { data: user, error: fetchError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("username", session.username)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ success: false, error: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(normalizedOldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: "Máº­t kháº©u cÅ© khÃ´ng chÃ­nh xÃ¡c" }, { status: 400 });
        }

        if (normalizedEmail !== user.email) {
            const { data: existingUser } = await supabaseAdmin
                .from("users")
                .select("email")
                .eq("email", normalizedEmail)
                .neq("id", user.id)
                .maybeSingle();

            if (existingUser) {
                return NextResponse.json({ success: false, error: "Email Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng" }, { status: 400 });
            }
        }

        const updateData: Record<string, unknown> = {
            display_name: normalizedDisplayName,
            email: normalizedEmail,
            bio: normalizedBio,
            avatar_url: normalizedAvatarUrl,
            location: normalizedLocation,
        };

        if (normalizedNewPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(normalizedNewPassword, salt);
        }

        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update(updateData)
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json({ success: false, error: "KhÃ´ng thá»ƒ cáº­p nháº­t thÃ´ng tin" }, { status: 500 });
        }

        await createUserSession(session.username);

        return NextResponse.json({ success: true, message: "Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng" });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
