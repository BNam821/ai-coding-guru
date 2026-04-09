import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ username: null, role: null, avatarUrl: null });
    }

    try {
        const { data } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("username", session.username)
            .single();

        return NextResponse.json({
            ...session,
            avatarUrl: data?.avatar_url || null,
        });
    } catch {
        return NextResponse.json({
            ...session,
            avatarUrl: null,
        });
    }
}
