import { ExamQuizExperience } from "@/components/test/exam-quiz-experience";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function QuizPage({
    searchParams,
}: {
    searchParams?: Promise<{
        debug?: string | string[];
        mode?: string | string[];
        lessonIds?: string | string[];
        sourceLabel?: string | string[];
    }>;
}) {
    const session = await getSession();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const debugValue = Array.isArray(resolvedSearchParams?.debug) ? resolvedSearchParams?.debug[0] : resolvedSearchParams?.debug;
    const modeValue = Array.isArray(resolvedSearchParams?.mode) ? resolvedSearchParams?.mode[0] : resolvedSearchParams?.mode;
    const lessonIdsValue = Array.isArray(resolvedSearchParams?.lessonIds) ? resolvedSearchParams?.lessonIds[0] : resolvedSearchParams?.lessonIds;
    const sourceLabelValue = Array.isArray(resolvedSearchParams?.sourceLabel) ? resolvedSearchParams?.sourceLabel[0] : resolvedSearchParams?.sourceLabel;
    const debugPreset = debugValue === "codeblock" ? "codeblock" : undefined;
    const initialSelectedLessonIds = lessonIdsValue
        ? lessonIdsValue.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    const initialMode = modeValue === "custom" && initialSelectedLessonIds.length > 0 ? "custom" : null;

    if (!session) {
        redirect("/dashboard/account?redirect=/test/exam");
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative">
            <div className="absolute inset-0 bg-deep-space -z-20" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[160px] -z-10" />

            <div className="container mx-auto">
                <ExamQuizExperience
                    debugPreset={debugPreset}
                    initialMode={initialMode}
                    initialSelectedLessonIds={initialSelectedLessonIds}
                    initialSelectionLabel={sourceLabelValue}
                />
            </div>
        </main>
    );
}
