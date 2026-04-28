import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase-admin";

const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const SESSION_VERSION = 1;
const SESSION_SECRET =
    process.env.SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_SECRET_KEY ||
    "";

const ADMIN_USERNAMES = new Set(
    (process.env.ADMIN_USERNAMES || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
);

const ADMIN_EMAILS = new Set(
    (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
);

type SessionCookiePayload = {
    username: string;
    version: number;
    expiresAt: number;
};

type UserRecord = Record<string, unknown> & {
    username?: string | null;
    email?: string | null;
    password?: string | null;
};

export type SessionRole = "admin" | "user";

export interface AppSession {
    username: string;
    role: SessionRole;
}

function getCookieOptions(maxAge = SESSION_TTL_SECONDS) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge,
        path: "/",
    };
}

function ensureSessionSecret() {
    if (!SESSION_SECRET) {
        throw new Error(
            "Missing SESSION_SECRET (or AUTH_SESSION_SECRET). Refusing to create unsigned sessions."
        );
    }

    return SESSION_SECRET;
}

function signValue(value: string) {
    const secret = ensureSessionSecret();
    return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSessionCookie(payload: SessionCookiePayload) {
    const payloadText = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const signature = signValue(payloadText);
    return `${payloadText}.${signature}`;
}

function decodeSessionCookie(token: string): SessionCookiePayload | null {
    const [payloadText, signature] = token.split(".");

    if (!payloadText || !signature) {
        return null;
    }

    const expectedSignature = signValue(payloadText);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(payloadText, "base64url").toString("utf8")) as SessionCookiePayload;

        if (
            !parsed ||
            typeof parsed.username !== "string" ||
            typeof parsed.version !== "number" ||
            typeof parsed.expiresAt !== "number"
        ) {
            return null;
        }

        if (parsed.version !== SESSION_VERSION || parsed.expiresAt <= Date.now()) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function normalizeIdentifier(value: string) {
    return value.trim();
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}

export function resolveUserRole(user: Record<string, unknown> | null | undefined): SessionRole {
    if (!user) {
        return "user";
    }

    const username = typeof user.username === "string" ? user.username.trim().toLowerCase() : "";
    const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
    const role = typeof user.role === "string" ? user.role.trim().toLowerCase() : "";
    const userType = typeof user.user_type === "string" ? user.user_type.trim().toLowerCase() : "";

    if (
        role === "admin" ||
        userType === "admin" ||
        user.is_admin === true ||
        user.admin === true ||
        ADMIN_USERNAMES.has(username) ||
        ADMIN_EMAILS.has(email)
    ) {
        return "admin";
    }

    return "user";
}

async function getUserRecordByUsername(username: string): Promise<UserRecord | null> {
    const normalizedUsername = normalizeIdentifier(username);
    if (!normalizedUsername) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("username", normalizedUsername)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data as UserRecord | null) || null;
}

async function getLoginUser(identifier: string): Promise<UserRecord | null> {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    if (!normalizedIdentifier) {
        return null;
    }

    const { data: usernameMatch, error: usernameError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("username", normalizedIdentifier)
        .maybeSingle();

    if (usernameError) {
        throw usernameError;
    }

    if (usernameMatch) {
        return usernameMatch as UserRecord;
    }

    if (!normalizedIdentifier.includes("@")) {
        return null;
    }

    const { data: emailMatch, error: emailError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", normalizeEmail(normalizedIdentifier))
        .maybeSingle();

    if (emailError) {
        throw emailError;
    }

    return (emailMatch as UserRecord | null) || null;
}

export async function createUserSession(username: string) {
    const normalizedUsername = normalizeIdentifier(username);
    if (!normalizedUsername) {
        throw new Error("Cannot create session without a valid username.");
    }

    const token = encodeSessionCookie({
        username: normalizedUsername,
        version: SESSION_VERSION,
        expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    });

    (await cookies()).set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function loginUser(username: string, pass: string) {
    try {
        const user = await getLoginUser(username);

        if (!user || typeof user.password !== "string") {
            return { success: false, error: "TÃ i khoáº£n hoáº·c máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c" };
        }

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            return { success: false, error: "TÃ i khoáº£n hoáº·c máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c" };
        }

        const sessionUsername = typeof user.username === "string" ? user.username : "";
        await createUserSession(sessionUsername);

        return { success: true, role: resolveUserRole(user) };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "ÄÃ£ cÃ³ lá»—i xáº£y ra" };
    }
}

export async function logoutUser() {
    (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<AppSession | null> {
    const rawSession = (await cookies()).get(SESSION_COOKIE_NAME);
    if (!rawSession?.value) {
        return null;
    }

    try {
        const payload = decodeSessionCookie(rawSession.value);
        if (!payload) {
            return null;
        }

        const user = await getUserRecordByUsername(payload.username);
        if (!user || typeof user.username !== "string") {
            return null;
        }

        return {
            username: user.username,
            role: resolveUserRole(user),
        };
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
