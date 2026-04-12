import { QuizGame } from "@/components/quiz/quiz-game";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function QuizPage({
    searchParams,
}: {
    searchParams?: Promise<{ debug?: string }>;
}) {
    const session = await getSession();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const debugPreset = resolvedSearchParams?.debug === "codeblock" ? "codeblock" : undefined;

    if (!session) {
        redirect("/dashboard/account?redirect=/test/exam");
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative">
            <div className="absolute inset-0 bg-deep-space -z-20" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[160px] -z-10" />

            <div className="container mx-auto">
                <QuizGame debugPreset={debugPreset} />
            </div>
        </main>
    );
}
