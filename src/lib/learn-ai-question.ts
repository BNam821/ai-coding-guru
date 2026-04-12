export interface LearnAiQuestionRequest {
    courseSlug: string;
    lessonSlug: string;
    lessonTitle: string;
    sectionId: string;
    sectionHeading: string;
    sectionIndex: number;
    sectionContent: string;
}

export interface LearnAiCodeCompletionQuestion {
    questionType: "code_completion";
    title: string;
    instruction: string;
    language: string;
    templateCode: string;
    blankPlaceholder: string;
    acceptedAnswers: string[];
    inputDescription: string;
    outputDescription: string;
    hint: string;
    explanation: string;
}

export interface LearnAiShortNumericQuestion {
    questionType: "short_numeric";
    title: string;
    instruction: string;
    question: string;
    correctAnswer: string;
    acceptedAnswers: string[];
    unit: string;
    hint: string;
    explanation: string;
}

export type LearnAiQuestion = LearnAiCodeCompletionQuestion | LearnAiShortNumericQuestion;

export function sanitizeModelJson(text: string) {
    const trimmed = text.trim();
    const fencedBlockMatch = trimmed.match(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i);

    if (fencedBlockMatch) {
        return fencedBlockMatch[1].trim();
    }

    return trimmed;
}

export function sanitizeAcceptedAnswers(values: string[]) {
    return Array.from(
        new Set(
            values
                .map((value) => value.trim())
                .filter(Boolean)
        )
    );
}

export function sanitizeCodeAnswer(value: string) {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/^\s+|\s+$/g, "")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim();
}

export function sanitizeNumericAnswer(value: string) {
    const normalized = value.trim().replace(/\s+/g, "").replace(/,/g, ".");

    if (!normalized) {
        return "";
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
        return normalized;
    }

    return parsed.toString();
}

function getStringField(value: unknown, fieldName: string) {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Missing or invalid "${fieldName}"`);
    }

    return value.trim();
}

function getStringArrayField(value: unknown, fieldName: string) {
    if (!Array.isArray(value)) {
        throw new Error(`Missing or invalid "${fieldName}"`);
    }

    const sanitized = sanitizeAcceptedAnswers(
        value.filter((item): item is string => typeof item === "string")
    );

    if (sanitized.length === 0) {
        throw new Error(`Missing or invalid "${fieldName}"`);
    }

    return sanitized;
}

export function validateLearnAiQuestion(payload: unknown): LearnAiQuestion {
    if (!payload || typeof payload !== "object") {
        throw new Error("Question payload must be an object");
    }

    const questionType = (payload as { questionType?: unknown }).questionType;

    if (questionType === "code_completion") {
        const templateCode = getStringField((payload as { templateCode?: unknown }).templateCode, "templateCode");
        const blankPlaceholder = getStringField((payload as { blankPlaceholder?: unknown }).blankPlaceholder, "blankPlaceholder");
        const acceptedAnswers = getStringArrayField((payload as { acceptedAnswers?: unknown }).acceptedAnswers, "acceptedAnswers");

        if (!templateCode.includes(blankPlaceholder)) {
            throw new Error('Template code must contain "blankPlaceholder"');
        }

        return {
            questionType,
            title: getStringField((payload as { title?: unknown }).title, "title"),
            instruction: getStringField((payload as { instruction?: unknown }).instruction, "instruction"),
            language: getStringField((payload as { language?: unknown }).language, "language"),
            templateCode,
            blankPlaceholder,
            acceptedAnswers,
            inputDescription: getStringField((payload as { inputDescription?: unknown }).inputDescription, "inputDescription"),
            outputDescription: getStringField((payload as { outputDescription?: unknown }).outputDescription, "outputDescription"),
            hint: getStringField((payload as { hint?: unknown }).hint, "hint"),
            explanation: getStringField((payload as { explanation?: unknown }).explanation, "explanation"),
        };
    }

    if (questionType === "short_numeric") {
        const correctAnswer = sanitizeNumericAnswer(String((payload as { correctAnswer?: unknown }).correctAnswer ?? ""));
        const acceptedAnswers = sanitizeAcceptedAnswers([
            ...getStringArrayField((payload as { acceptedAnswers?: unknown }).acceptedAnswers, "acceptedAnswers"),
            correctAnswer,
        ]).map(sanitizeNumericAnswer).filter(Boolean);

        if (!correctAnswer) {
            throw new Error('Missing or invalid "correctAnswer"');
        }

        if (acceptedAnswers.length === 0) {
            throw new Error('Missing or invalid "acceptedAnswers"');
        }

        return {
            questionType,
            title: getStringField((payload as { title?: unknown }).title, "title"),
            instruction: getStringField((payload as { instruction?: unknown }).instruction, "instruction"),
            question: getStringField((payload as { question?: unknown }).question, "question"),
            correctAnswer,
            acceptedAnswers,
            unit: typeof (payload as { unit?: unknown }).unit === "string" ? (payload as { unit?: string }).unit?.trim() || "" : "",
            hint: getStringField((payload as { hint?: unknown }).hint, "hint"),
            explanation: getStringField((payload as { explanation?: unknown }).explanation, "explanation"),
        };
    }

    throw new Error('Unsupported "questionType"');
}
