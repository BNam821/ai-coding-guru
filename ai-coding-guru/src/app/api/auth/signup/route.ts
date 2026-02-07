import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

const USERS_PATH = path.join(process.cwd(), "src/data/users.json");

async function getUsers() {
    try {
        const fileContent = await fs.readFile(USERS_PATH, "utf-8");
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();
        const users = await getUsers();

        // Kiểm tra trùng lặp
        if (users.find((u: any) => u.username === username)) {
            return NextResponse.json({ success: false, error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
        }
        if (users.find((u: any) => u.email === email)) {
            return NextResponse.json({ success: false, error: "Email đã được sử dụng" }, { status: 400 });
        }

        // Hash mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), "utf-8");

        return NextResponse.json({ success: true, message: "Đăng ký thành công" });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
