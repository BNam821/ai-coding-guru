import { supabaseAdmin } from "@/lib/supabase-admin";

export const AI_TASK_TYPES = [
    "learn-ai-question",
    "quiz-generation",
    "dashboard-ai-evaluation",
    "code-evaluation",
] as const;

export const AI_INTERACTION_STATUSES = ["success", "error"] as const;
export const AI_LOG_PAGE_SIZE = 20;

export type AiTaskType = typeof AI_TASK_TYPES[number];
export type AiInteractionStatus = typeof AI_INTERACTION_STATUSES[number];
export type AiLogViewerRole = "admin" | "user";

type JsonRecord = Record<string, unknown>;

export interface AiInteractionReportInfo {
    isReported: boolean;
    reportedAt: string | null;
    reportedBy: string | null;
    source: string | null;
}

type RawAiInteractionRow = {
    id?: string | null;
    username?: string | null;
    task_type?: string | null;
    prompt_id?: string | null;
    endpoint?: string | null;
    model_provider?: string | null;
    model_name?: string | null;
    status?: string | null;
    request_payload?: unknown;
    metadata?: unknown;
    prompt_text?: string | null;
    response_text?: string | null;
    response_payload?: unknown;
    error_message?: string | null;
    duration_ms?: number | null;
    created_at?: string | null;
    expires_at?: string | null;
};

export interface AiInteractionRow {
    id: string;
    username: string | null;
    task_type: AiTaskType;
    prompt_id: string | null;
    endpoint: string;
    model_provider: string;
    model_name: string;
    status: AiInteractionStatus;
    request_payload: JsonRecord;
    metadata: JsonRecord;
    prompt_text: string | null;
    response_text: string | null;
    response_payload: unknown;
    error_message: string | null;
    duration_ms: number | null;
    created_at: string;
    expires_at: string;
}

interface AiLogListItemBase {
    id: string;
    visibility: AiLogViewerRole;
    username: string | null;
    taskType: AiTaskType;
    promptId: string | null;
    endpoint: string;
    modelProvider: string;
    modelName: string;
    status: AiInteractionStatus;
    metadata: JsonRecord;
    report: AiInteractionReportInfo;
    responseText: string | null;
    responsePayload: unknown;
    errorMessage: string | null;
    durationMs: number | null;
    createdAt: string;
    expiresAt: string;
}

export interface AiAdminLogListItem extends AiLogListItemBase {
    visibility: "admin";
    requestPayload: JsonRecord;
    promptText: string | null;
}

export interface AiUserLogListItem extends AiLogListItemBase {
    visibility: "user";
}

export type AiLogListItem = AiAdminLogListItem | AiUserLogListItem;

export interface PersistAiInteractionInput {
    username?: string | null;
    taskType: AiTaskType;
    promptId?: string | null;
    endpoint: string;
    modelProvider: string;
    modelName: string;
    status: AiInteractionStatus;
    requestPayload?: JsonRecord;
    metadata?: JsonRecord;
    promptText?: string | null;
    responseText?: string | null;
    responsePayload?: unknown;
    errorMessage?: string | null;
    durationMs?: number | null;
}

export interface ListAiInteractionsInput {
    viewerRole: AiLogViewerRole;
    viewerUsername?: string | null;
    username?: string;
    taskType?: AiTaskType;
    status?: AiInteractionStatus;
    from?: string;
    to?: string;
    page?: number;
}

export interface ListAiInteractionsResult<TLog extends AiLogListItem = AiLogListItem> {
    logs: TLog[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface MarkAiInteractionReportedInput {
    interactionId: string;
    viewerRole?: AiLogViewerRole | null;
    viewerUsername?: string | null;
    reportedBy?: string | null;
    reportSource?: string | null;
}

export interface MarkAiInteractionReportedResult {
    success: boolean;
    reason?: "not_found" | "forbidden";
    alreadyReported?: boolean;
    interactionId?: string;
    report?: AiInteractionReportInfo;
}

export interface FindLatestAiInteractionIdInput {
    username: string;
    taskType: AiTaskType;
    endpoint?: string;
}

const AI_TASK_LABELS: Record<AiTaskType, string> = {
    "learn-ai-question": "Cau hoi bai hoc",
    "quiz-generation": "Tao quiz",
    "dashboard-ai-evaluation": "Phan tich dashboard",
    "code-evaluation": "Cham code",
};

const AI_STATUS_LABELS: Record<AiInteractionStatus, string> = {
    success: "Thanh cong",
    error: "Loi",
};

function isJsonRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeJsonRecord(value: unknown): JsonRecord {
    return isJsonRecord(value) ? value : {};
}

function normalizeText(value: unknown, fallback = "") {
    return typeof value === "string" ? value : fallback;
}

function normalizeNullableText(value: unknown) {
    return typeof value === "string" ? value : null;
}

function normalizeNullableNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
}

function normalizeTaskType(value: unknown): AiTaskType {
    return isAiTaskType(value) ? value : "learn-ai-question";
}

function normalizeStatus(value: unknown): AiInteractionStatus {
    return isAiInteractionStatus(value) ? value : "error";
}

function buildDateStart(value: string) {
    return `${value}T00:00:00+07:00`;
}

function buildDateEndExclusive(value: string) {
    const nextDate = new Date(`${value}T00:00:00+07:00`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate.toISOString();
}

function normalizeAiInteractionRow(row: RawAiInteractionRow): AiInteractionRow {
    return {
        id: normalizeText(row.id, ""),
        username: normalizeNullableText(row.username),
        task_type: normalizeTaskType(row.task_type),
        prompt_id: normalizeNullableText(row.prompt_id),
        endpoint: normalizeText(row.endpoint, ""),
        model_provider: normalizeText(row.model_provider, "google"),
        model_name: normalizeText(row.model_name, ""),
        status: normalizeStatus(row.status),
        request_payload: normalizeJsonRecord(row.request_payload),
        metadata: normalizeJsonRecord(row.metadata),
        prompt_text: normalizeNullableText(row.prompt_text),
        response_text: normalizeNullableText(row.response_text),
        response_payload: row.response_payload ?? null,
        error_message: normalizeNullableText(row.error_message),
        duration_ms: normalizeNullableNumber(row.duration_ms),
        created_at: normalizeText(row.created_at, new Date(0).toISOString()),
        expires_at: normalizeText(row.expires_at, new Date(0).toISOString()),
    };
}

export function getAiInteractionReportInfo(metadata: JsonRecord): AiInteractionReportInfo {
    const report = isJsonRecord(metadata.report) ? metadata.report : null;
    const reportedAt = typeof report?.reportedAt === "string" ? report.reportedAt : null;

    return {
        isReported: report?.isReported === true || Boolean(reportedAt),
        reportedAt,
        reportedBy: typeof report?.reportedBy === "string" ? report.reportedBy : null,
        source: typeof report?.source === "string" ? report.source : null,
    };
}

function serializeAiInteractionForAdmin(row: AiInteractionRow): AiAdminLogListItem {
    return {
        visibility: "admin",
        id: row.id,
        username: row.username,
        taskType: row.task_type,
        promptId: row.prompt_id,
        endpoint: row.endpoint,
        modelProvider: row.model_provider,
        modelName: row.model_name,
        status: row.status,
        requestPayload: row.request_payload,
        metadata: row.metadata,
        report: getAiInteractionReportInfo(row.metadata),
        promptText: row.prompt_text,
        responseText: row.response_text,
        responsePayload: row.response_payload,
        errorMessage: row.error_message,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
    };
}

function serializeAiInteractionForUser(row: AiInteractionRow): AiUserLogListItem {
    return {
        visibility: "user",
        id: row.id,
        username: row.username,
        taskType: row.task_type,
        promptId: row.prompt_id,
        endpoint: row.endpoint,
        modelProvider: row.model_provider,
        modelName: row.model_name,
        status: row.status,
        metadata: row.metadata,
        report: getAiInteractionReportInfo(row.metadata),
        responseText: row.response_text,
        responsePayload: row.response_payload,
        errorMessage: row.error_message,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
    };
}

export function isAiTaskType(value: unknown): value is AiTaskType {
    return typeof value === "string" && (AI_TASK_TYPES as readonly string[]).includes(value);
}

export function isAiInteractionStatus(value: unknown): value is AiInteractionStatus {
    return typeof value === "string" && (AI_INTERACTION_STATUSES as readonly string[]).includes(value);
}

export function parseAiTaskType(value: string | null | undefined) {
    return isAiTaskType(value) ? value : undefined;
}

export function parseAiInteractionStatus(value: string | null | undefined) {
    return isAiInteractionStatus(value) ? value : undefined;
}

export function getAiTaskLabel(taskType: AiTaskType) {
    return AI_TASK_LABELS[taskType];
}

export function getAiStatusLabel(status: AiInteractionStatus) {
    return AI_STATUS_LABELS[status];
}

export async function persistAiInteraction(input: PersistAiInteractionInput) {
    try {
        const { data, error } = await supabaseAdmin
            .from("ai_interactions")
            .insert([
                {
                    username: input.username ?? null,
                    task_type: input.taskType,
                    prompt_id: input.promptId ?? null,
                    endpoint: input.endpoint,
                    model_provider: input.modelProvider,
                    model_name: input.modelName,
                    status: input.status,
                    request_payload: input.requestPayload ?? {},
                    metadata: input.metadata ?? {},
                    prompt_text: input.promptText ?? null,
                    response_text: input.responseText ?? null,
                    response_payload: input.responsePayload ?? null,
                    error_message: input.errorMessage ?? null,
                    duration_ms: input.durationMs ?? null,
                },
            ])
            .select("id")
            .single();

        if (error) {
            console.error("AI interaction log skipped:", error);
            return null;
        }

        return normalizeNullableText(data?.id);
    } catch (error) {
        console.error("AI interaction log skipped:", error);
        return null;
    }
}

export async function listAiInteractions<TLog extends AiLogListItem = AiLogListItem>(
    input: ListAiInteractionsInput,
): Promise<ListAiInteractionsResult<TLog>> {
    const page = Number.isFinite(input.page) && (input.page || 0) > 0 ? Math.floor(input.page || 1) : 1;
    const fromIndex = (page - 1) * AI_LOG_PAGE_SIZE;
    const toIndex = fromIndex + AI_LOG_PAGE_SIZE - 1;
    let query = supabaseAdmin
        .from("ai_interactions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(fromIndex, toIndex);

    if (input.viewerRole === "admin") {
        if (input.username) {
            query = query.eq("username", input.username);
        }
    } else {
        if (!input.viewerUsername) {
            return {
                logs: [] as TLog[],
                page,
                pageSize: AI_LOG_PAGE_SIZE,
                totalCount: 0,
                totalPages: 0,
            };
        }

        query = query.eq("username", input.viewerUsername);
    }

    if (input.taskType) {
        query = query.eq("task_type", input.taskType);
    }

    if (input.status) {
        query = query.eq("status", input.status);
    }

    if (input.from) {
        query = query.gte("created_at", buildDateStart(input.from));
    }

    if (input.to) {
        query = query.lt("created_at", buildDateEndExclusive(input.to));
    }

    const { data, error, count } = await query;

    if (error) {
        console.error("Failed to fetch AI interactions:", error);
        return {
            logs: [] as TLog[],
            page,
            pageSize: AI_LOG_PAGE_SIZE,
            totalCount: 0,
            totalPages: 0,
        };
    }

    const rows = ((data || []) as RawAiInteractionRow[]).map(normalizeAiInteractionRow);
    const logs = input.viewerRole === "admin"
        ? rows.map(serializeAiInteractionForAdmin)
        : rows.map(serializeAiInteractionForUser);
    const totalCount = count || 0;

    return {
        logs: logs as TLog[],
        page,
        pageSize: AI_LOG_PAGE_SIZE,
        totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / AI_LOG_PAGE_SIZE) : 0,
    };
}

export async function cleanupExpiredAiInteractions() {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
        .from("ai_interactions")
        .delete()
        .lte("expires_at", now)
        .select("id");

    if (error) {
        throw error;
    }

    return {
        deletedCount: data?.length || 0,
        cleanedAt: now,
    };
}

export async function findLatestAiInteractionId(
    input: FindLatestAiInteractionIdInput,
): Promise<string | null> {
    let query = supabaseAdmin
        .from("ai_interactions")
        .select("id")
        .eq("username", input.username)
        .eq("task_type", input.taskType)
        .order("created_at", { ascending: false })
        .limit(1);

    if (input.endpoint) {
        query = query.eq("endpoint", input.endpoint);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error("Failed to find latest AI interaction id:", error);
        return null;
    }

    return normalizeNullableText(data?.id);
}

export async function markAiInteractionReported(
    input: MarkAiInteractionReportedInput,
): Promise<MarkAiInteractionReportedResult> {
    const { data, error } = await supabaseAdmin
        .from("ai_interactions")
        .select("id, username, metadata")
        .eq("id", input.interactionId)
        .maybeSingle();

    if (error) {
        console.error("Failed to read AI interaction for report:", error);
        return { success: false, reason: "not_found" };
    }

    const interaction = data as { id?: string | null; username?: string | null; metadata?: unknown } | null;
    if (!interaction?.id) {
        return { success: false, reason: "not_found" };
    }

    const ownerUsername = normalizeNullableText(interaction.username);
    const isAdmin = input.viewerRole === "admin";

    if (!isAdmin && ownerUsername && input.viewerUsername !== ownerUsername) {
        return { success: false, reason: "forbidden" };
    }

    const currentMetadata = normalizeJsonRecord(interaction.metadata);
    const currentReport = getAiInteractionReportInfo(currentMetadata);

    if (currentReport.isReported) {
        return {
            success: true,
            alreadyReported: true,
            interactionId: interaction.id,
            report: currentReport,
        };
    }

    const nextReport: AiInteractionReportInfo = {
        isReported: true,
        reportedAt: new Date().toISOString(),
        reportedBy: input.reportedBy ?? input.viewerUsername ?? ownerUsername ?? null,
        source: input.reportSource?.trim() || null,
    };
    const nextMetadata = {
        ...currentMetadata,
        report: nextReport,
    };

    const { error: updateError } = await supabaseAdmin
        .from("ai_interactions")
        .update({
            metadata: nextMetadata,
        })
        .eq("id", interaction.id);

    if (updateError) {
        console.error("Failed to mark AI interaction as reported:", updateError);
        return { success: false, reason: "not_found" };
    }

    return {
        success: true,
        alreadyReported: false,
        interactionId: interaction.id,
        report: nextReport,
    };
}
