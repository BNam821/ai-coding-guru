import { getFullLearningTree, type CourseWithChapters, type Lesson } from "@/lib/learn-db";
import { supabase } from "@/lib/supabase";

interface DashboardHistoryRow {
    lesson_id: string;
    course_slug: string;
    lesson_slug: string;
    lesson_title: string;
    updated_at: string;
}

interface DashboardScoreRow {
    score: number;
}

interface DashboardUserRow {
    display_name: string | null;
    avatar_url: string | null;
}

export interface DashboardUserSummary {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
}

export interface DashboardWeeklyActivityDay {
    dateKey: string;
    label: string;
    count: number;
}

export interface DashboardStats {
    completedCourses: number;
    inProgressCourses: number;
    quizAttempts: number;
    averageScore: string;
}

export interface DashboardCourseCard {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    chapterCount: number;
    lessonCount: number;
    completedLessons: number;
    progress: number;
    status: "not_started" | "in_progress" | "completed";
    nextLessonHref: string | null;
    nextLessonTitle: string | null;
    lastVisitedAt: string | null;
}

export interface DashboardNextLesson {
    courseSlug: string;
    courseTitle: string;
    lessonSlug: string;
    lessonTitle: string;
    href: string;
    statusLabel: string;
    progressLabel: string;
}

export interface DashboardViewModel {
    user: DashboardUserSummary;
    weeklyActivity: DashboardWeeklyActivityDay[];
    maxWeeklyCount: number;
    stats: DashboardStats;
    nextLessons: DashboardNextLesson[];
    courses: DashboardCourseCard[];
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

function formatDateKey(value: Date | string) {
    return DATE_KEY_FORMATTER.format(typeof value === "string" ? new Date(value) : value);
}

function getOrderedLessons(course: CourseWithChapters) {
    return course.chapters.flatMap((chapter) => chapter.lessons || []);
}

function getCourseHistory(courseSlug: string, history: DashboardHistoryRow[]) {
    return history
        .filter((item) => item.course_slug === courseSlug)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

function getVisitedLessonSet(courseSlug: string, history: DashboardHistoryRow[]) {
    return new Set(
        history
            .filter((item) => item.course_slug === courseSlug)
            .map((item) => item.lesson_slug)
    );
}

function findNextLesson(orderedLessons: Lesson[], visitedLessonSlugs: Set<string>, courseHistory: DashboardHistoryRow[]) {
    if (orderedLessons.length === 0) {
        return null;
    }

    if (visitedLessonSlugs.size === 0) {
        return orderedLessons[0];
    }

    const lastVisitedLessonSlug = courseHistory[0]?.lesson_slug;
    const lastVisitedIndex = orderedLessons.findIndex((lesson) => lesson.slug === lastVisitedLessonSlug);

    if (lastVisitedIndex >= 0) {
        for (let index = lastVisitedIndex + 1; index < orderedLessons.length; index += 1) {
            if (!visitedLessonSlugs.has(orderedLessons[index].slug)) {
                return orderedLessons[index];
            }
        }
    }

    return orderedLessons.find((lesson) => !visitedLessonSlugs.has(lesson.slug)) || null;
}

function buildWeeklyActivity(history: DashboardHistoryRow[]) {
    const countsByDay = new Map<string, number>();

    for (const item of history) {
        const key = formatDateKey(item.updated_at);
        countsByDay.set(key, (countsByDay.get(key) || 0) + 1);
    }

    const days: DashboardWeeklyActivityDay[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        const key = formatDateKey(date);
        days.push({
            dateKey: key,
            label: WEEKDAY_LABELS[date.getDay()],
            count: countsByDay.get(key) || 0,
        });
    }

    return days;
}

function buildCourseCard(course: CourseWithChapters, history: DashboardHistoryRow[]): DashboardCourseCard {
    const orderedLessons = getOrderedLessons(course);
    const visitedLessonSlugs = getVisitedLessonSet(course.slug, history);
    const courseHistory = getCourseHistory(course.slug, history);
    const completedLessons = orderedLessons.filter((lesson) => visitedLessonSlugs.has(lesson.slug)).length;
    const lessonCount = orderedLessons.length;
    const progress = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;
    const nextLesson = findNextLesson(orderedLessons, visitedLessonSlugs, courseHistory);

    let status: DashboardCourseCard["status"] = "not_started";
    if (progress >= 100 && lessonCount > 0) {
        status = "completed";
    } else if (progress > 0) {
        status = "in_progress";
    }

    return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        imageUrl: course.image_url,
        chapterCount: course.chapters.length,
        lessonCount,
        completedLessons,
        progress,
        status,
        nextLessonHref: nextLesson ? `/learn/${course.slug}/${nextLesson.slug}` : null,
        nextLessonTitle: nextLesson?.title || null,
        lastVisitedAt: courseHistory[0]?.updated_at || null,
    };
}

function buildNextLessons(courses: DashboardCourseCard[], learningTree: CourseWithChapters[]) {
    const courseMap = new Map(learningTree.map((course) => [course.slug, course]));

    const prioritizedCourses = [...courses]
        .filter((course) => course.status !== "completed")
        .sort((a, b) => {
            if (a.status === b.status) {
                if (a.status === "in_progress" && b.status === "in_progress") {
                    return new Date(b.lastVisitedAt || 0).getTime() - new Date(a.lastVisitedAt || 0).getTime();
                }
                return 0;
            }

            return a.status === "in_progress" ? -1 : 1;
        });

    return prioritizedCourses
        .map((course) => {
            const sourceCourse = courseMap.get(course.slug);
            if (!sourceCourse || !course.nextLessonHref || !course.nextLessonTitle) {
                return null;
            }

            return {
                courseSlug: course.slug,
                courseTitle: course.title,
                lessonSlug: course.nextLessonHref.split("/").pop() || "",
                lessonTitle: course.nextLessonTitle,
                href: course.nextLessonHref,
                statusLabel: course.status === "in_progress" ? "Tiếp tục" : "Sẵn sàng bắt đầu",
                progressLabel: `${course.completedLessons}/${course.lessonCount} bài`,
            } satisfies DashboardNextLesson;
        })
        .filter((item): item is DashboardNextLesson => item !== null)
        .slice(0, 4);
}

export async function getDashboardData(session: { username: string; role: string }): Promise<DashboardViewModel> {
    const [profileRes, historyRes, scoresRes, learningTree] = await Promise.all([
        supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("username", session.username)
            .maybeSingle<DashboardUserRow>(),
        supabase
            .from("user_learning_history")
            .select("lesson_id, course_slug, lesson_slug, lesson_title, updated_at")
            .eq("username", session.username)
            .order("updated_at", { ascending: false })
            .returns<DashboardHistoryRow[]>(),
        supabase
            .from("quiz_scores")
            .select("score")
            .eq("username", session.username)
            .returns<DashboardScoreRow[]>(),
        getFullLearningTree(),
    ]);

    if (profileRes.error) {
        throw profileRes.error;
    }

    if (historyRes.error) {
        throw historyRes.error;
    }

    if (scoresRes.error) {
        throw scoresRes.error;
    }

    const history = historyRes.data || [];
    const scores = scoresRes.data || [];
    const courses = learningTree.map((course) => buildCourseCard(course, history));
    const weeklyActivity = buildWeeklyActivity(history);
    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    const averageScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : "0";

    return {
        user: {
            username: session.username,
            displayName: profileRes.data?.display_name || session.username,
            avatarUrl: profileRes.data?.avatar_url || null,
            role: session.role,
        },
        weeklyActivity,
        maxWeeklyCount: Math.max(...weeklyActivity.map((item) => item.count), 1),
        stats: {
            completedCourses: courses.filter((course) => course.status === "completed").length,
            inProgressCourses: courses.filter((course) => course.status === "in_progress").length,
            quizAttempts: scores.length,
            averageScore,
        },
        nextLessons: buildNextLessons(courses, learningTree),
        courses,
    };
}
