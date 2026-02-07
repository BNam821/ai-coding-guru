import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();

        // Kiểm tra trùng lặp bằng cách query trực tiếp Supabase
        const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("username, email")
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();

        if (checkError) {
            console.error("Check error:", checkError);
            throw new Error("Lỗi kiểm tra dữ liệu");
        }

        if (existingUser) {
            if (existingUser.username === username) {
                return NextResponse.json({ success: false, error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
            }
            if (existingUser.email === email) {
                return NextResponse.json({ success: false, error: "Email đã được sử dụng" }, { status: 400 });
            }
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Chèn người dùng mới vào Supabase
        const { error: insertError } = await supabase
            .from("users")
            .insert([
                {
                    username,
                    email,
                    password: hashedPassword,
                }
            ]);

        if (insertError) {
            console.error("Insert error:", insertError);
            return NextResponse.json({ success: false, error: "Không thể đăng ký tài khoản" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Đăng ký thành công" });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
