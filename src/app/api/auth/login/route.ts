import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { buildRateLimitKey, consumeRateLimit, getRateLimitHeaders } from "@/lib/security";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();
        const rateLimit = consumeRateLimit({
            key: buildRateLimitKey(req, "auth-login", typeof username === "string" ? username : null),
            limit: 8,
            windowMs: 15 * 60 * 1000,
        });

        if (!rateLimit.ok) {
            return NextResponse.json(
                { success: false, error: "Too many login attempts. Please try again later." },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        if (typeof username !== "string" || typeof password !== "string") {
            return NextResponse.json(
                { success: false, error: "Invalid login payload" },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        const result = await loginUser(username, password);

        return NextResponse.json(result, {
            headers: getRateLimitHeaders(rateLimit),
        });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
