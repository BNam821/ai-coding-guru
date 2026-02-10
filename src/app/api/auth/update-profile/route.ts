import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Báº¡n cáº§n Ä‘Äƒng nháº­p" }, { status: 401 });
        }

        const { username, email, newPassword, oldPassword } = await req.json();

        // 1. Láº¥y thÃ´ng tin ngÆ°á» i dÃ¹ng hiá»‡n táº¡i tá»« DB
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("username", session.username)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ success: false, error: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á» i dÃ¹ng" }, { status: 404 });
        }

        // 2. XÃ¡c thá»±c máº­t kháº©u cÅ©
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: "Máº­t kháº©u cÅ© khÃ´ng chÃ­nh xÃ¡c" }, { status: 400 });
        }

        // 3. Kiá»ƒm tra trÃ¹ng láº·p Email/Username má»›i (náº¿u thay Ä‘á»•i)
        if (username !== user.username || email !== user.email) {
            const { data: existingUser } = await supabase
                .from("users")
                .select("username, email")
                .or(`username.eq.${username},email.eq.${email}`)
                .neq("id", user.id)
                .maybeSingle();

            if (existingUser) {
                if (existingUser.username === username) {
                    return NextResponse.json({ success: false, error: "TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i" }, { status: 400 });
                }
                if (existingUser.email === email) {
                    return NextResponse.json({ success: false, error: "Email Ä‘Ã£ Ä‘Æ°á»£c sá» dá»¥ng" }, { status: 400 });
                }
            }
        }

        // 4. Chuáº©n bá»‹ dá»¯ liá»‡u cáº­p nháº­t
        const updateData: any = { username, email };
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        // 5. Cáº­p nháº­t DB
        const { error: updateError } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json({ success: false, error: "KhÃ´ng thá»ƒ cáº­p nháº­t thÃ´ng tin" }, { status: 500 });
        }

        // 6. Cáº­p nháº­t Session cookie
        (await cookies()).set("session", JSON.stringify({ username, role: session.role }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        return NextResponse.json({ success: true, message: "Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng" });

    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
