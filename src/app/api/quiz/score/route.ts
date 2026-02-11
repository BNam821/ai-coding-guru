import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { score } = await req.json();

        if (typeof score !== 'number' || score < 0 || score > 100) {
            return NextResponse.json({ success: false, error: "Invalid score" }, { status: 400 });
        }

        const { error } = await supabase
            .from("quiz_scores")
            .insert([
                {
                    username: session.username,
                    score: score
                }
            ]);

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Quiz Score API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
