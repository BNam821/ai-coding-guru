import {
    persistAiInteraction,
    type AiTaskType,
} from "@/lib/ai-interactions";

type JsonRecord = Record<string, unknown>;

type LoggedAiTaskResult<TValue> = {
    value: TValue;
    responsePayload?: unknown;
    metadata?: JsonRecord;
};

type LoggedAiTaskErrorContext = {
    responseText?: string | null;
    responsePayload?: unknown;
    metadata?: JsonRecord;
};

export interface RunLoggedAiTaskOptions<TValue> {
    username?: string | null;
    taskType: AiTaskType;
    promptId?: string | null;
    endpoint: string;
    modelProvider: string;
    modelName: string;
    requestPayload?: JsonRecord;
    metadata?: JsonRecord;
    promptText: string;
    generateResponseText: (promptText: string) => Promise<string>;
    parseResponse: (responseText: string) => Promise<LoggedAiTaskResult<TValue>> | LoggedAiTaskResult<TValue>;
}

export class LoggedAiTaskError extends Error {
    context: LoggedAiTaskErrorContext;

    constructor(message: string, context: LoggedAiTaskErrorContext = {}, cause?: unknown) {
        super(message);
        this.name = "LoggedAiTaskError";
        this.context = context;

        if (cause !== undefined) {
            (this as Error & { cause?: unknown }).cause = cause;
        }
    }
}

function mergeMetadata(...parts: Array<JsonRecord | undefined>) {
    return parts.reduce<JsonRecord>((acc, part) => {
        if (!part) {
            return acc;
        }

        return {
            ...acc,
            ...part,
        };
    }, {});
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "Unknown AI logging error";
}

export async function runLoggedAiTask<TValue>(options: RunLoggedAiTaskOptions<TValue>): Promise<TValue> {
    const startedAt = Date.now();
    let responseText: string | null = null;
    let responsePayload: unknown = null;

    try {
        responseText = await options.generateResponseText(options.promptText);
        const parsed = await options.parseResponse(responseText);
        responsePayload = parsed.responsePayload ?? null;

        await persistAiInteraction({
            username: options.username ?? null,
            taskType: options.taskType,
            promptId: options.promptId ?? null,
            endpoint: options.endpoint,
            modelProvider: options.modelProvider,
            modelName: options.modelName,
            status: "success",
            requestPayload: options.requestPayload ?? {},
            metadata: mergeMetadata(options.metadata, parsed.metadata),
            promptText: options.promptText,
            responseText,
            responsePayload,
            durationMs: Date.now() - startedAt,
        });

        return parsed.value;
    } catch (error) {
        const context = error instanceof LoggedAiTaskError ? error.context : undefined;
        const mergedMetadata = mergeMetadata(options.metadata, context?.metadata);

        if (typeof context?.responseText === "string") {
            responseText = context.responseText;
        }

        if (context?.responsePayload !== undefined) {
            responsePayload = context.responsePayload;
        }

        await persistAiInteraction({
            username: options.username ?? null,
            taskType: options.taskType,
            promptId: options.promptId ?? null,
            endpoint: options.endpoint,
            modelProvider: options.modelProvider,
            modelName: options.modelName,
            status: "error",
            requestPayload: options.requestPayload ?? {},
            metadata: mergedMetadata,
            promptText: options.promptText,
            responseText,
            responsePayload,
            errorMessage: getErrorMessage(error),
            durationMs: Date.now() - startedAt,
        });

        throw error;
    }
}
