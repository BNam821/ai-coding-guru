import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createUserSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildRateLimitKey, consumeRateLimit, getRateLimitHeaders } from "@/lib/security";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeUsername(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: unknown) {
    return typeof value === "string" ? value : "";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const username = normalizeUsername(body.username);
        const email = normalizeEmail(body.email);
        const password = normalizePassword(body.password);
        const rateLimit = consumeRateLimit({
            key: buildRateLimitKey(req, "auth-signup", email || username || null),
            limit: 5,
            windowMs: 60 * 60 * 1000,
        });

        if (!rateLimit.ok) {
            return NextResponse.json(
                { success: false, error: "Too many signup attempts. Please try again later." },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        if (!USERNAME_REGEX.test(username)) {
            return NextResponse.json(
                { success: false, error: "Username must be 3-32 characters and use only letters, numbers, or underscores." },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        if (!SIMPLE_EMAIL_REGEX.test(email) || email.length > 254) {
            return NextResponse.json(
                { success: false, error: "Email address is invalid." },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        if (password.length < 8 || password.length > 128) {
            return NextResponse.json(
                { success: false, error: "Password must be between 8 and 128 characters." },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        const { data: existingUserByUsername, error: usernameCheckError } = await supabaseAdmin
            .from("users")
            .select("username")
            .eq("username", username)
            .maybeSingle();

        if (usernameCheckError) {
            console.error("Check error:", usernameCheckError);
            throw new Error("Lá»—i kiá»ƒm tra dá»¯ liá»‡u");
        }

        if (existingUserByUsername) {
            return NextResponse.json(
                { success: false, error: "TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i" },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        const { data: existingUserByEmail, error: emailCheckError } = await supabaseAdmin
            .from("users")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (emailCheckError) {
            console.error("Check error:", emailCheckError);
            throw new Error("Lá»—i kiá»ƒm tra dá»¯ liá»‡u");
        }

        if (existingUserByEmail) {
            return NextResponse.json(
                { success: false, error: "Email Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng" },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert([
                {
                    username,
                    email,
                    password: hashedPassword,
                },
            ]);

        if (insertError) {
            console.error("Insert error:", insertError);
            return NextResponse.json(
                { success: false, error: "KhÃ´ng thá»ƒ Ä‘Äƒng kÃ½ tÃ i khoáº£n" },
                {
                    status: 500,
                    headers: getRateLimitHeaders(rateLimit),
                }
            );
        }

        await createUserSession(username);

        return NextResponse.json(
            {
                success: true,
                message: "ÄÄƒng kÃ½ thÃ nh cÃ´ng",
                autoLoggedIn: true,
            },
            {
                headers: getRateLimitHeaders(rateLimit),
            }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
