import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

export async function loginUser(username: string, pass: string, adminKey?: string) {
    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .or(`username.eq.${username},email.eq.${username}`)
            .single();

        if (error || !user) {
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
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "Đã có lỗi xảy ra" };
    }
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
