import { logoutUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
    await logoutUser();
    return NextResponse.json({ success: true });
}
