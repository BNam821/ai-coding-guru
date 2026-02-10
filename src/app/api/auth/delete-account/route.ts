import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getSession, logoutUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Báº¡n cáº§n Ä‘Äƒng nháº­p" }, { status: 401 });
        }

        const { password } = await req.json();

        // 1. Láº¥y ngÆ°á» i dÃ¹ng tá»« DB
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("username", session.username)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ success: false, error: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á» i dÃ¹ng" }, { status: 404 });
        }

        // 2. XÃ¡c thá»±c máº­t kháº©u
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: "Máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c" }, { status: 400 });
        }

        // 3. XÃ³a ngÆ°á» i dÃ¹ng trong DB
        const { error: deleteError } = await supabase
            .from("users")
            .delete()
            .eq("id", user.id);

        if (deleteError) {
            return NextResponse.json({ success: false, error: "KhÃ´ng thá»ƒ xÃ³a tÃ i khoáº£n" }, { status: 500 });
        }

        // 4. XÃ³a Session
        await logoutUser();

        return NextResponse.json({ success: true, message: "XÃ³a tÃ i khoáº£n thÃ nh cÃ´ng" });

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
