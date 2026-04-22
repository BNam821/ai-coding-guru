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

export interface LearnAiShortConceptQuestion {
    questionType: "short_concept";
    title: string;
    instruction: string;
    question: string;
    canonicalAnswer: string;
    acceptedAnswers: string[];
    keywordGroups: string[][];
    hint: string;
    explanation: string;
}

export type LearnAiQuestion =
    | LearnAiCodeCompletionQuestion
    | LearnAiShortNumericQuestion
    | LearnAiShortConceptQuestion;

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

export function sanitizeLooseTextAnswer(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function sanitizeKeywordGroups(values: string[][]) {
    return values
        .filter((group): group is string[] => Array.isArray(group))
        .map((group) => sanitizeAcceptedAnswers(group.filter((item): item is string => typeof item === "string")))
        .map((group) => group.map(sanitizeLooseTextAnswer).filter(Boolean))
        .filter((group) => group.length > 0);
}

const VIETNAMESE_DIACRITIC_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

export function hasVietnameseDiacritics(value: string) {
    return VIETNAMESE_DIACRITIC_REGEX.test(value);
}

function assertVietnameseDisplayText(value: string, fieldName: string) {
    if (!hasVietnameseDiacritics(value)) {
        throw new Error(`"${fieldName}" phải là tiếng Việt có dấu`);
    }

    return value;
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

function getStringMatrixField(value: unknown, fieldName: string) {
    if (!Array.isArray(value)) {
        throw new Error(`Missing or invalid "${fieldName}"`);
    }

    const sanitized = sanitizeKeywordGroups(value);

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
            title: assertVietnameseDisplayText(getStringField((payload as { title?: unknown }).title, "title"), "title"),
            instruction: assertVietnameseDisplayText(getStringField((payload as { instruction?: unknown }).instruction, "instruction"), "instruction"),
            language: getStringField((payload as { language?: unknown }).language, "language"),
            templateCode,
            blankPlaceholder,
            acceptedAnswers,
            inputDescription: assertVietnameseDisplayText(getStringField((payload as { inputDescription?: unknown }).inputDescription, "inputDescription"), "inputDescription"),
            outputDescription: assertVietnameseDisplayText(getStringField((payload as { outputDescription?: unknown }).outputDescription, "outputDescription"), "outputDescription"),
            hint: assertVietnameseDisplayText(getStringField((payload as { hint?: unknown }).hint, "hint"), "hint"),
            explanation: assertVietnameseDisplayText(getStringField((payload as { explanation?: unknown }).explanation, "explanation"), "explanation"),
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
            title: assertVietnameseDisplayText(getStringField((payload as { title?: unknown }).title, "title"), "title"),
            instruction: assertVietnameseDisplayText(getStringField((payload as { instruction?: unknown }).instruction, "instruction"), "instruction"),
            question: assertVietnameseDisplayText(getStringField((payload as { question?: unknown }).question, "question"), "question"),
            correctAnswer,
            acceptedAnswers,
            unit: typeof (payload as { unit?: unknown }).unit === "string" ? (payload as { unit?: string }).unit?.trim() || "" : "",
            hint: assertVietnameseDisplayText(getStringField((payload as { hint?: unknown }).hint, "hint"), "hint"),
            explanation: assertVietnameseDisplayText(getStringField((payload as { explanation?: unknown }).explanation, "explanation"), "explanation"),
        };
    }

    if (questionType === "short_concept") {
        const canonicalAnswer = getStringField((payload as { canonicalAnswer?: unknown }).canonicalAnswer, "canonicalAnswer");
        const acceptedAnswers = sanitizeAcceptedAnswers([
            ...getStringArrayField((payload as { acceptedAnswers?: unknown }).acceptedAnswers, "acceptedAnswers"),
            canonicalAnswer,
        ]);
        const keywordGroups = getStringMatrixField((payload as { keywordGroups?: unknown }).keywordGroups, "keywordGroups");

        return {
            questionType,
            title: assertVietnameseDisplayText(getStringField((payload as { title?: unknown }).title, "title"), "title"),
            instruction: assertVietnameseDisplayText(getStringField((payload as { instruction?: unknown }).instruction, "instruction"), "instruction"),
            question: assertVietnameseDisplayText(getStringField((payload as { question?: unknown }).question, "question"), "question"),
            canonicalAnswer: assertVietnameseDisplayText(canonicalAnswer, "canonicalAnswer"),
            acceptedAnswers,
            keywordGroups,
            hint: assertVietnameseDisplayText(getStringField((payload as { hint?: unknown }).hint, "hint"), "hint"),
            explanation: assertVietnameseDisplayText(getStringField((payload as { explanation?: unknown }).explanation, "explanation"), "explanation"),
        };
    }

    throw new Error('Unsupported "questionType"');
}

export function evaluateLearnAiAnswer(question: LearnAiQuestion, userAnswer: string) {
    if (question.questionType === "code_completion") {
        const normalizedUserAnswer = sanitizeCodeAnswer(userAnswer);
        return question.acceptedAnswers
            .map(sanitizeCodeAnswer)
            .includes(normalizedUserAnswer);
    }

    if (question.questionType === "short_numeric") {
        const normalizedUserAnswer = sanitizeNumericAnswer(userAnswer);
        return question.acceptedAnswers
            .map(sanitizeNumericAnswer)
            .includes(normalizedUserAnswer);
    }

    const normalizedUserAnswer = sanitizeLooseTextAnswer(userAnswer);

    if (!normalizedUserAnswer) {
        return false;
    }

    const matchesAcceptedAnswer = question.acceptedAnswers
        .map(sanitizeLooseTextAnswer)
        .includes(normalizedUserAnswer);

    if (matchesAcceptedAnswer) {
        return true;
    }

    return question.keywordGroups.every((group) =>
        group.some((keyword) => normalizedUserAnswer.includes(keyword))
    );
}
