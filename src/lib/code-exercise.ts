import type { CodingProblem } from "@/lib/coding-problems-service";

export type CodeExerciseType = "solve" | "fix_bug";

export const DEFAULT_CODE_EXERCISE_TYPE: CodeExerciseType = "solve";

export interface PreparedCodingProblem extends CodingProblem {
    exerciseType: CodeExerciseType;
    exerciseLabel: string;
    exerciseDescription: string;
    starterCode: string;
    bugChangeSummary?: string;
}

interface BugMutationResult {
    starterCode: string;
    changeSummary: string;
}

export function parseCodeExerciseType(value?: string | null): CodeExerciseType {
    return value === "fix_bug" ? "fix_bug" : DEFAULT_CODE_EXERCISE_TYPE;
}

export function getCodeExerciseMeta(exerciseType: CodeExerciseType) {
    if (exerciseType === "fix_bug") {
        return {
            label: "Sửa lỗi code",
            description:
                "AI đã cố ý biến đổi một phần quan trọng trong lời giải hoàn chỉnh. Nhiệm vụ của bạn là đọc, debug và sửa lại để chương trình cho kết quả đúng.",
        };
    }

    return {
        label: "Hoàn thiện code",
        description:
            "Bạn nhận skeleton code và cần hoàn thiện phần còn thiếu để giải đúng đề bài.",
    };
}

export function prepareCodingProblem(problem: CodingProblem, exerciseType: CodeExerciseType): PreparedCodingProblem {
    if (exerciseType === "fix_bug") {
        const bugVariant = createBuggyStarterCode(problem.solution_code);
        const meta = getCodeExerciseMeta(exerciseType);

        return {
            ...problem,
            exerciseType,
            exerciseLabel: meta.label,
            exerciseDescription: meta.description,
            starterCode: bugVariant.starterCode,
            bugChangeSummary: bugVariant.changeSummary,
        };
    }

    const meta = getCodeExerciseMeta(exerciseType);

    return {
        ...problem,
        exerciseType,
        exerciseLabel: meta.label,
        exerciseDescription: meta.description,
        starterCode: problem.skeleton_code,
    };
}

function createBuggyStarterCode(solutionCode: string): BugMutationResult {
    return (
        mutateControlFlow(solutionCode) ??
        mutateCondition(solutionCode) ??
        mutateArithmetic(solutionCode) ??
        removeKeyStep(solutionCode) ?? {
            starterCode: solutionCode,
            changeSummary: "fallback_original",
        }
    );
}

function mutateControlFlow(code: string): BugMutationResult | null {
    const lines = code.split("\n");

    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim();
        if (!trimmed.startsWith("for") && !trimmed.startsWith("while")) {
            continue;
        }

        const mutated = mutateComparisonToken(lines[index]);
        if (mutated && mutated !== lines[index]) {
            lines[index] = mutated;
            return {
                starterCode: lines.join("\n"),
                changeSummary: "control_flow_condition_changed",
            };
        }
    }

    return null;
}

function mutateCondition(code: string): BugMutationResult | null {
    const lines = code.split("\n");

    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim();
        if (!trimmed.startsWith("if")) {
            continue;
        }

        const mutated = mutateComparisonToken(lines[index]);
        if (mutated && mutated !== lines[index]) {
            lines[index] = mutated;
            return {
                starterCode: lines.join("\n"),
                changeSummary: "branch_condition_changed",
            };
        }
    }

    return null;
}

function mutateArithmetic(code: string): BugMutationResult | null {
    const lines = code.split("\n");

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const trimmed = line.trim();

        if (
            !trimmed ||
            trimmed.startsWith("#") ||
            trimmed.startsWith("//") ||
            trimmed.startsWith("using ") ||
            trimmed.startsWith("return ") ||
            trimmed === "{" ||
            trimmed === "}"
        ) {
            continue;
        }

        if (trimmed.includes("\"") || trimmed.includes("'")) {
            continue;
        }

        const mutated = line.replace(
            /([A-Za-z0-9_\]\)])\s*([+\-*/%])\s*([A-Za-z0-9_\[(])/,
            (_match, left: string, operator: string, right: string) => {
                const replacement = getReplacementOperator(operator);
                return `${left} ${replacement} ${right}`;
            }
        );

        if (mutated !== line) {
            lines[index] = mutated;
            return {
                starterCode: lines.join("\n"),
                changeSummary: "arithmetic_operator_changed",
            };
        }
    }

    return null;
}

function removeKeyStep(code: string): BugMutationResult | null {
    const lines = code.split("\n");
    const candidateIndex = lines.findIndex((line) => isExecutableLine(line));

    if (candidateIndex === -1) {
        return null;
    }

    lines.splice(candidateIndex, 1);

    return {
        starterCode: lines.join("\n"),
        changeSummary: "key_processing_step_removed",
    };
}

function mutateComparisonToken(line: string) {
    const replacements: Array<[RegExp, string]> = [
        [/<=/, "<"],
        [/>=/, ">"],
        [/==/, "!="],
        [/!=/, "=="],
        [/(?<!<)</, "<="],
        [/(?<!>)>/, ">="],
    ];

    for (const [pattern, replacement] of replacements) {
        if (pattern.test(line)) {
            return line.replace(pattern, replacement);
        }
    }

    return line;
}

function getReplacementOperator(operator: string) {
    switch (operator) {
        case "+":
            return "-";
        case "-":
            return "+";
        case "*":
            return "+";
        case "/":
            return "*";
        case "%":
            return "+";
        default:
            return operator;
    }
}

function isExecutableLine(line: string) {
    const trimmed = line.trim();

    if (
        !trimmed ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("using ") ||
        trimmed.startsWith("int main") ||
        trimmed.startsWith("return ") ||
        trimmed === "{" ||
        trimmed === "}"
    ) {
        return false;
    }

    return true;
}
