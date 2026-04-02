export type WikiAuthorRole = "admin" | "member";
export type WikiSubmissionStatus = "pending" | "approved" | "rejected";

export interface WikiEditHistoryEntry {
    edited_at: string;
    editor_username: string;
    editor_display_name: string | null;
    edit_reason: string;
}

export function getWikiAuthorRole(role?: string | null): WikiAuthorRole {
    return role === "admin" ? "admin" : "member";
}

export function generateWikiSlug(title: string) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function calculateWikiReadTime(content: string) {
    return `${Math.ceil((content || "").split(/\s+/).filter(Boolean).length / 200) || 1} phút`;
}

export function getWikiPublishDate() {
    return new Date().toLocaleDateString("vi-VN");
}
