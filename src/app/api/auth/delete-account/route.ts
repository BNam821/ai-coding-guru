import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSession, logoutUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Báº¡n cáº§n Ä‘Äƒng nháº­p" }, { status: 401 });
        }

        const { password } = await req.json();

        const { data: user, error: fetchError } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("username", session.username)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ success: false, error: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(typeof password === "string" ? password : "", user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: "Máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c" }, { status: 400 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", user.id);

        if (deleteError) {
            return NextResponse.json({ success: false, error: "KhÃ´ng thá»ƒ xÃ³a tÃ i khoáº£n" }, { status: 500 });
        }

        await logoutUser();

        return NextResponse.json({ success: true, message: "XÃ³a tÃ i khoáº£n thÃ nh cÃ´ng" });
    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
