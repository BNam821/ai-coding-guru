import { Buffer } from "buffer";

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

type GlobalRateLimitStore = typeof globalThis & {
    __aiCodingGuruRateLimitStore?: Map<string, RateLimitEntry>;
};

export type RateLimitResult = {
    ok: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
};

export interface RateLimitOptions {
    key: string;
    limit: number;
    windowMs: number;
}

export interface NormalizedUrlOptions {
    allowRelative?: boolean;
    maxLength?: number;
}

export type SniffedImage =
    | {
        ok: true;
        contentType: "image/jpeg" | "image/png" | "image/webp";
        extension: "jpg" | "png" | "webp";
    }
    | {
        ok: false;
        error: string;
    };

function getRateLimitStore() {
    const globalStore = globalThis as GlobalRateLimitStore;

    if (!globalStore.__aiCodingGuruRateLimitStore) {
        globalStore.__aiCodingGuruRateLimitStore = new Map<string, RateLimitEntry>();
    }

    return globalStore.__aiCodingGuruRateLimitStore;
}

function pruneExpiredRateLimits(store: Map<string, RateLimitEntry>, now: number) {
    for (const [key, value] of store.entries()) {
        if (value.resetAt <= now) {
            store.delete(key);
        }
    }
}

export function consumeRateLimit(options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const store = getRateLimitStore();
    pruneExpiredRateLimits(store, now);

    const current = store.get(options.key);
    const nextResetAt = current && current.resetAt > now
        ? current.resetAt
        : now + options.windowMs;
    const nextCount = current && current.resetAt > now
        ? current.count + 1
        : 1;

    store.set(options.key, {
        count: nextCount,
        resetAt: nextResetAt,
    });

    const remaining = Math.max(0, options.limit - nextCount);

    return {
        ok: nextCount <= options.limit,
        limit: options.limit,
        remaining,
        resetAt: nextResetAt,
        retryAfterSeconds: Math.max(1, Math.ceil((nextResetAt - now) / 1000)),
    };
}

export function getRateLimitHeaders(result: RateLimitResult) {
    return {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    };
}

export function getRequestIp(req: Request) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const firstIp = forwardedFor.split(",")[0]?.trim();
        if (firstIp) {
            return firstIp;
        }
    }

    const realIp = req.headers.get("x-real-ip")?.trim();
    if (realIp) {
        return realIp;
    }

    const cfIp = req.headers.get("cf-connecting-ip")?.trim();
    if (cfIp) {
        return cfIp;
    }

    return "unknown";
}

export function buildRateLimitKey(req: Request, bucket: string, identity?: string | null) {
    const ip = getRequestIp(req);
    const normalizedIdentity = typeof identity === "string" && identity.trim()
        ? identity.trim().toLowerCase()
        : "guest";

    return `${bucket}:${normalizedIdentity}:${ip}`;
}

export function normalizeOptionalHttpUrl(
    value: unknown,
    options: NormalizedUrlOptions = {},
) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const maxLength = options.maxLength ?? 2048;
    if (trimmed.length > maxLength) {
        return null;
    }

    if (options.allowRelative && trimmed.startsWith("/")) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
        }

        return parsed.toString();
    } catch {
        return null;
    }
}

export function sanitizeStoragePathSegment(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);

    return normalized || "user";
}

export function sniffImageUpload(buffer: Buffer, contentType: string): SniffedImage {
    const normalizedContentType = contentType.trim().toLowerCase();

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        if (normalizedContentType && normalizedContentType !== "image/jpeg" && normalizedContentType !== "image/jpg") {
            return { ok: false, error: "File signature does not match declared image type." };
        }

        return { ok: true, contentType: "image/jpeg", extension: "jpg" };
    }

    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        if (normalizedContentType && normalizedContentType !== "image/png") {
            return { ok: false, error: "File signature does not match declared image type." };
        }

        return { ok: true, contentType: "image/png", extension: "png" };
    }

    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        if (normalizedContentType && normalizedContentType !== "image/webp") {
            return { ok: false, error: "File signature does not match declared image type." };
        }

        return { ok: true, contentType: "image/webp", extension: "webp" };
    }

    return {
        ok: false,
        error: "Only JPEG, PNG, and WEBP images are allowed.",
    };
}
