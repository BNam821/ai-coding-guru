import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

const USERS_PATH = path.join(process.cwd(), "src/data/users.json");
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "campha8@";

async function getUsers() {
    try {
        const fileContent = await fs.readFile(USERS_PATH, "utf-8");
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function loginUser(username: string, pass: string, adminKey?: string) {
    const users = await getUsers();
    const user = users.find((u: any) => u.username === username || u.email === username);

    if (!user) {
        return { success: false, error: "Tài khoản hoặc mật khẩu không chính xác" };
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
        return { success: false, error: "Tài khoản hoặc mật khẩu không chính xác" };
    }

    // Kiểm tra quyền Admin
    let role = "user";
    if (adminKey === ADMIN_SECRET_KEY) {
        role = "admin";
    }

    // Set session cookie
    (await cookies()).set("session", JSON.stringify({ username: user.username, role }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
    });

    return { success: true, role };
}

export async function logoutUser() {
    (await cookies()).delete("session");
}

export async function getSession() {
    const session = (await cookies()).get("session");
    if (!session) return null;
    try {
        return JSON.parse(session.value);
    } catch {
        return null;
    }
}

export async function isAdminAuthenticated() {
    const session = await getSession();
    return session?.role === "admin";
}

export async function isUserAuthenticated() {
    const session = await getSession();
    return !!session;
}
