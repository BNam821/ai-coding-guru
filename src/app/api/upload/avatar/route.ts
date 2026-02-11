import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        // 1. Xác thực người dùng (Admin hoặc Member đều được)
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // 2. Lấy file từ FormData
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        // 3. Validate cơ bản (trên server để chắc chắn)
        if (file.size > 2 * 1024 * 1024) { // check lại lần nữa dù client đã nén
            return NextResponse.json({ success: false, error: "File too large (>2MB)" }, { status: 400 });
        }

        // 4. Upload lên Supabase Storage dùng Admin Key (Bypass RLS)
        // Tạo tên file unique
        const fileExt = file.name.split(".").pop();
        const fileName = `${session.username}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from("avatars")
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: true
            });

        if (uploadError) {
            console.error("Supabase Storage Error:", uploadError);
            return NextResponse.json({ success: false, error: "Storage upload failed" }, { status: 500 });
        }

        // 5. Lấy Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from("avatars")
            .getPublicUrl(filePath);

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error: any) {
        console.error("Upload API Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
