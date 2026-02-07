import { loginUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { username, password, adminKey } = await req.json();
        const result = await loginUser(username, password, adminKey);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
