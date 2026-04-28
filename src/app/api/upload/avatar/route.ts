import { randomUUID } from "crypto";
import { Buffer } from "buffer";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
    buildRateLimitKey,
    consumeRateLimit,
    getRateLimitHeaders,
    sanitizeStoragePathSegment,
    sniffImageUpload,
} from "@/lib/security";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = consumeRateLimit({
        key: buildRateLimitKey(req, "avatar-upload", session.username),
        limit: 10,
        windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.ok) {
        return NextResponse.json(
            { success: false, error: "Too many upload attempts. Please wait and try again." },
            { status: 429, headers: getRateLimitHeaders(rateLimit) },
        );
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        if (file.size <= 0 || file.size > MAX_AVATAR_SIZE_BYTES) {
            return NextResponse.json(
                { success: false, error: "File too large (>2MB) or empty" },
                { status: 400, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const sniffedImage = sniffImageUpload(buffer, file.type || "");

        if (!sniffedImage.ok) {
            return NextResponse.json(
                { success: false, error: sniffedImage.error },
                { status: 400, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const userFolder = sanitizeStoragePathSegment(session.username);
        const filePath = `${userFolder}/${randomUUID()}.${sniffedImage.extension}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from("avatars")
            .upload(filePath, buffer, {
                contentType: sniffedImage.contentType,
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase Storage Error:", uploadError);
            return NextResponse.json(
                { success: false, error: "Storage upload failed" },
                { status: 500, headers: getRateLimitHeaders(rateLimit) },
            );
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("avatars")
            .getPublicUrl(filePath);

        return NextResponse.json(
            { success: true, url: publicUrl },
            { headers: getRateLimitHeaders(rateLimit) },
        );
    } catch (error: any) {
        console.error("Upload API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500, headers: getRateLimitHeaders(rateLimit) },
        );
    }
}
