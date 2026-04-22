import { ExamQuizExperience } from "@/components/test/exam-quiz-experience";
import { getSession } from "@/lib/auth";
import { PRODUCT_TOUR_STEP_PARAM, getProductTourStep } from "@/lib/product-tour";
import { redirect } from "next/navigation";

export default async function QuizPage({
    searchParams,
}: {
    searchParams?: Promise<{
        debug?: string | string[];
        mode?: string | string[];
        lessonIds?: string | string[];
        sourceLabel?: string | string[];
        tourStep?: string | string[];
    }>;
}) {
    const session = await getSession();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const debugValue = Array.isArray(resolvedSearchParams?.debug) ? resolvedSearchParams?.debug[0] : resolvedSearchParams?.debug;
    const modeValue = Array.isArray(resolvedSearchParams?.mode) ? resolvedSearchParams?.mode[0] : resolvedSearchParams?.mode;
    const lessonIdsValue = Array.isArray(resolvedSearchParams?.lessonIds) ? resolvedSearchParams?.lessonIds[0] : resolvedSearchParams?.lessonIds;
    const sourceLabelValue = Array.isArray(resolvedSearchParams?.sourceLabel) ? resolvedSearchParams?.sourceLabel[0] : resolvedSearchParams?.sourceLabel;
    const tourStepValue =
        typeof resolvedSearchParams?.[PRODUCT_TOUR_STEP_PARAM] === "string"
            ? resolvedSearchParams[PRODUCT_TOUR_STEP_PARAM]
            : Array.isArray(resolvedSearchParams?.[PRODUCT_TOUR_STEP_PARAM])
                ? resolvedSearchParams[PRODUCT_TOUR_STEP_PARAM][0]
                : null;
    const debugPreset = debugValue === "codeblock" ? "codeblock" : undefined;
    const initialSelectedLessonIds = lessonIdsValue
        ? lessonIdsValue.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    const initialMode =
        modeValue === "auto"
            ? "auto"
            : modeValue === "custom" && initialSelectedLessonIds.length > 0
                ? "custom"
                : null;
    const activeTourStep = getProductTourStep(tourStepValue);
    const isQuizGuideStep = activeTourStep?.id === "lesson-quiz-check" && activeTourStep.kind === "guided-content";

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
                    guideStep={isQuizGuideStep ? {
                        badge: activeTourStep.badge,
                        title: activeTourStep.title,
                        description: activeTourStep.description,
                    } : null}
                />
            </div>
        </main>
    );
}
