export const ANNOUNCEMENT_LIMIT = 2;
export const ANNOUNCEMENT_MAX_LENGTH = 280;

export interface SiteAnnouncement {
    id: number;
    message: string;
    created_at: string;
    updated_at: string;
    created_by?: string | null;
}

export function normalizeAnnouncementMessage(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

export function validateAnnouncementMessage(message: string) {
    if (!message) {
        return "Nội dung thông báo không được để trống";
    }

    if (message.length > ANNOUNCEMENT_MAX_LENGTH) {
        return `Thông báo chỉ được tối đa ${ANNOUNCEMENT_MAX_LENGTH} ký tự`;
    }

    return null;
}
