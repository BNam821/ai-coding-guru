import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Bạn cần đăng nhập" }, { status: 401 });
        }

        const { username, email, newPassword, oldPassword } = await req.json();

        // 1. Lấy thông tin người dùng hiện tại từ DB
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("username", session.username)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ success: false, error: "Không tìm thấy người dùng" }, { status: 404 });
        }

        // 2. Xác thực mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: "Mật khẩu cũ không chính xác" }, { status: 400 });
        }

        // 3. Kiểm tra trùng lặp Email/Username mới (nếu thay đổi)
        if (username !== user.username || email !== user.email) {
            const { data: existingUser } = await supabase
                .from("users")
                .select("username, email")
                .or(`username.eq.${username},email.eq.${email}`)
                .neq("id", user.id)
                .maybeSingle();

            if (existingUser) {
                if (existingUser.username === username) {
                    return NextResponse.json({ success: false, error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
                }
                if (existingUser.email === email) {
                    return NextResponse.json({ success: false, error: "Email đã được sử dụng" }, { status: 400 });
                }
            }
        }

        // 4. Chuẩn bị dữ liệu cập nhật
        const updateData: any = { username, email };
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        // 5. Cập nhật DB
        const { error: updateError } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", user.id);

        if (updateError) {
            return NextResponse.json({ success: false, error: "Không thể cập nhật thông tin" }, { status: 500 });
        }

        // 6. Cập nhật Session cookie
        (await cookies()).set("session", JSON.stringify({ username, role: session.role }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        return NextResponse.json({ success: true, message: "Cập nhật thông tin thành công" });

    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
