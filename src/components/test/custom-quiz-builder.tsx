"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckSquare2, FolderTree, Loader2 } from "lucide-react";

export interface CustomQuizLessonOption {
    id: string;
    title: string;
    slug: string;
    updatedAt: string | null;
    progressPercent: number | null;
}

export interface CustomQuizChapterOption {
    id: string;
    title: string;
    lessons: CustomQuizLessonOption[];
}

export interface CustomQuizCourseOption {
    id: string;
    title: string;
    slug: string;
    chapters: CustomQuizChapterOption[];
}

export interface CustomQuizStartPayload {
    mode: "custom";
    selectedLessonIds: string[];
    selectedLessonCount: number;
    questionCount: number;
}

interface CustomQuizBuilderProps {
    onStart: (payload: CustomQuizStartPayload) => void;
    onBack: () => void;
}

function resolveQuestionCount(lessonCount: number) {
    if (lessonCount > 10) return 40;
    if (lessonCount >= 8) return 30;
    if (lessonCount >= 5) return 20;
    if (lessonCount >= 3) return 10;

    return 0;
}

function formatDate(value: string | null) {
    if (!value) return "Chua ro";

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

export function CustomQuizBuilder({ onStart, onBack }: CustomQuizBuilderProps) {
    const [courses, setCourses] = useState<CustomQuizCourseOption[]>([]);
    const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadOptions = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await fetch("/api/quiz/custom-options", { cache: "no-store" });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Khong the tai lich su hoc tap");
                }

                setCourses(data.courses || []);
            } catch (err: any) {
                setError(err.message || "Khong the tai danh sach bai hoc da hoc.");
            } finally {
                setLoading(false);
            }
        };

        void loadOptions();
    }, []);

    const totalSelected = selectedLessonIds.size;
    const questionCount = resolveQuestionCount(totalSelected);

    const totalLearnedLessons = useMemo(
        () => courses.reduce(
            (courseAcc, course) => courseAcc + course.chapters.reduce(
                (chapterAcc, chapter) => chapterAcc + chapter.lessons.length,
                0
            ),
            0
        ),
        [courses]
    );

    const toggleLessonIds = (lessonIds: string[]) => {
        setSelectedLessonIds((prev) => {
            const next = new Set(prev);
            const shouldSelect = lessonIds.some((id) => !next.has(id));

            for (const id of lessonIds) {
                if (shouldSelect) {
                    next.add(id);
                } else {
                    next.delete(id);
                }
            }

            return next;
        });
    };

    const getGroupState = (lessonIds: string[]) => {
        const selectedCount = lessonIds.filter((lessonId) => selectedLessonIds.has(lessonId)).length;

        return {
            selectedCount,
            allSelected: lessonIds.length > 0 && selectedCount === lessonIds.length,
        };
    };

    if (loading) {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center">
                <div className="rounded-3xl border border-white/10 bg-black/40 px-8 py-10 text-center text-white backdrop-blur-xl">
                    <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-yellow-400" />
                    <p className="text-lg font-bold">Dang tai lich su hoc tap cua ban...</p>
                    <p className="mt-2 text-sm text-gray-400">He thong dang gom bai hoc da hoc de ban chon de kiem tra.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
                <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                    <p className="text-lg font-bold text-white">Khong the tai danh sach bai hoc</p>
                    <p className="mt-2 text-sm text-red-200">{error}</p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft size={16} />
                        Quay lai chon che do
                    </button>
                </div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center">
                <div className="w-full rounded-3xl border border-white/10 bg-black/40 p-6 text-center text-white backdrop-blur-xl">
                    <BookOpen className="mx-auto mb-4 h-10 w-10 text-gray-400" />
                    <p className="text-lg font-bold">Chua co bai hoc nao trong lich su hoc tap</p>
                    <p className="mt-2 text-sm text-gray-400">
                        Ban can hoc it nhat vai bai trong he thong truoc khi tao bai kiem tra tu chon.
                    </p>
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft size={16} />
                        Quay lai chon che do
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-black/40 p-6 backdrop-blur-xl md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/60 transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft size={14} />
                        Doi che do
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Bai kiem tra tu chon</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400 md:text-base">
                            Chon bai hoc, chuong hoac toan bo khoa hoc tu lich su hoc tap cua ban. He thong se chi dung nhung bai ban da chon de tao de trac nghiem ca nhan hoa.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-50 md:min-w-[280px]">
                    <div className="flex items-center gap-2 font-bold">
                        <CheckSquare2 size={16} />
                        Tom tat lua chon
                    </div>
                    <p className="mt-3 text-3xl font-black">{totalSelected}</p>
                    <p className="text-yellow-100/75">bai hoc da chon tren tong {totalLearnedLessons} bai trong lich su</p>
                    <div className="mt-4 rounded-xl border border-yellow-300/15 bg-black/20 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-yellow-100/55">So cau se tao</p>
                        <p className="mt-1 text-2xl font-black">{questionCount || "--"}</p>
                        <p className="mt-1 text-xs text-yellow-100/70">
                            3-4 bai: 10 cau, 5-7 bai: 20 cau, 8-10 bai: 30 cau, tren 10 bai: 40 cau.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onStart({
                            mode: "custom",
                            selectedLessonIds: Array.from(selectedLessonIds),
                            selectedLessonCount: totalSelected,
                            questionCount,
                        })}
                        disabled={questionCount === 0}
                        className="mt-4 w-full rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition-all hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Tao bai kiem tra
                    </button>
                    {questionCount === 0 && (
                        <p className="mt-2 text-xs text-yellow-100/70">
                            Hay chon it nhat 3 bai hoc de he thong bat dau tao de.
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {courses.map((course) => {
                    const courseLessonIds = course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id));
                    const courseState = getGroupState(courseLessonIds);

                    return (
                        <section key={course.id} className="rounded-[24px] border border-white/10 bg-black/30 p-5 backdrop-blur-md">
                            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={courseState.allSelected}
                                        onChange={() => toggleLessonIds(courseLessonIds)}
                                        className="mt-1 h-5 w-5 rounded border-white/20 bg-black/20 text-yellow-400"
                                    />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-400/80">{course.slug}</p>
                                        <h2 className="text-2xl font-black text-white">{course.title}</h2>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
                                    <FolderTree size={14} />
                                    {courseState.selectedCount}/{courseLessonIds.length} bai da chon trong khoa nay
                                </div>
                            </div>

                            <div className="mt-4 space-y-4">
                                {course.chapters.map((chapter) => {
                                    const chapterLessonIds = chapter.lessons.map((lesson) => lesson.id);
                                    const chapterState = getGroupState(chapterLessonIds);

                                    return (
                                        <div key={chapter.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                                            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={chapterState.allSelected}
                                                        onChange={() => toggleLessonIds(chapterLessonIds)}
                                                        className="mt-1 h-4 w-4 rounded border-white/20 bg-black/20 text-yellow-400"
                                                    />
                                                    <div>
                                                        <p className="text-lg font-bold text-white">{chapter.title}</p>
                                                        <p className="text-xs text-gray-400">Chon ca chuong de lay toan bo bai trong muc nay.</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-white/55">
                                                    {chapterState.selectedCount}/{chapterLessonIds.length} bai da chon
                                                </div>
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                {chapter.lessons.map((lesson) => {
                                                    const isChecked = selectedLessonIds.has(lesson.id);

                                                    return (
                                                        <label
                                                            key={lesson.id}
                                                            className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all ${
                                                                isChecked
                                                                    ? "border-yellow-400/40 bg-yellow-400/10"
                                                                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => toggleLessonIds([lesson.id])}
                                                                className="mt-1 h-4 w-4 rounded border-white/20 bg-black/20 text-yellow-400"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-white">{lesson.title}</p>
                                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                                                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                                                        Hoc luc: {formatDate(lesson.updatedAt)}
                                                                    </span>
                                                                    {typeof lesson.progressPercent === "number" && (
                                                                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                                                            Tien do: {lesson.progressPercent}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
