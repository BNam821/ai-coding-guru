const deepseekApiKey = process.env.DEEPSEEK_API_KEY || "";
const deepseekBaseUrl = (process.env.DEEPSEEK_API_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

if (!deepseekApiKey) {
    console.warn("Missing DEEPSEEK_API_KEY environment variable");
}

interface DeepSeekChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface DeepSeekChatCompletionPayload {
    model: string;
    messages: DeepSeekChatMessage[];
    response_format?: {
        type: "json_object";
    };
}

interface DeepSeekChatCompletionResponse {
    choices?: Array<{
        message?: {
            content?: string | null;
        };
    }>;
    error?: {
        message?: string;
    };
}

export function isDeepSeekConfigured() {
    return Boolean(deepseekApiKey);
}

export async function createDeepSeekJsonCompletion(messages: DeepSeekChatMessage[]) {
    if (!deepseekApiKey) {
        throw new Error("Thiếu cấu hình DeepSeek cho tính năng này.");
    }

    const payload: DeepSeekChatCompletionPayload = {
        model: deepseekModel,
        messages,
        response_format: {
            type: "json_object",
        },
    };

    const response = await fetch(`${deepseekBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekApiKey}`,
        },
        body: JSON.stringify(payload),
    });

    const responseJson = await response.json() as DeepSeekChatCompletionResponse;

    if (!response.ok) {
        throw new Error(responseJson.error?.message || "DeepSeek request failed");
    }

    const content = responseJson.choices?.[0]?.message?.content?.trim();

    if (!content) {
        throw new Error("DeepSeek returned an empty response");
    }

    return content;
}
