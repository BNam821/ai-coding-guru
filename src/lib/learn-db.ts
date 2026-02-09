import { supabase } from '@/lib/supabase';

// --- Types ---

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    order: number;
    created_at: string;
}

export interface Chapter {
    id: string;
    course_id: string;
    title: string;
    order: number;
    created_at: string;
    lessons?: Lesson[]; // For hierarchical fetching
}

export interface Lesson {
    id: string;
    chapter_id: string;
    title: string;
    slug: string;
    content: string | null;
    order: number;
    created_at: string;
}

export interface CourseWithChapters extends Course {
    chapters: Chapter[];
}

// --- Data Fetching Functions ---

/**
 * Get all courses, ordered by 'order' column.
 */
export async function getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching courses:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a single course by its slug.
 */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            console.error(`Error fetching course with slug "${slug}":`, error);
        }
        return null;
    }

    return data;
}

/**
 * Get the full syllabus (chapters + lessons) for a specific course ID.
 */
export async function getCourseSyllabus(courseId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
        .from('chapters')
        .select(`
      *,
      lessons (
        id,
        chapter_id,
        title,
        slug,
        order
      )
    `)
        .eq('course_id', courseId)
        .order('order', { ascending: true });

    if (error) {
        console.error(`Error fetching syllabus for course "${courseId}":`, error);
        return [];
    }


    // Sort lessons within each chapter safely
    const chapters = data?.map((chapter) => ({
        ...chapter,
        lessons: (chapter.lessons || []).sort((a: Lesson, b: Lesson) => (a.order || 0) - (b.order || 0)),
    }));

    return chapters || [];
}

/**
 * Get a single lesson by its slug and the course slug.
 * Note: Since slug is unique per chapter, we might need to find the lesson first then verify course.
 * However, to keep it simple and performant, we find lesson by slug directly (since we made it unique across chapter, hopefully unique enough).
 * 
 * Better approach for URL /learn/[course]/[lesson]:
 * 1. Find course by slug.
 * 2. Find lesson by slug where lesson.chapter.course_id = course.id
 */
export async function getLesson(courseSlug: string, lessonSlug: string): Promise<Lesson | null> {
    // First, get the course to ensure context
    const course = await getCourseBySlug(courseSlug);
    if (!course) return null;

    // Query lesson where its chapter belongs to this course
    const { data, error } = await supabase
        .from('lessons')
        .select('*, chapters!inner(course_id)') // !inner join ensures chapter filters apply
        .eq('slug', lessonSlug)
        .eq('chapters.course_id', course.id)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error(`Error fetching lesson "${lessonSlug}" in course "${courseSlug}":`, error);
        }
        return null;
    }

    return data;
}

/**
 * Get the full tree of courses -> chapters -> lessons for the sidebar.
 */
export async function getFullLearningTree(): Promise<CourseWithChapters[]> {
    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      chapters (
        id,
        title,
        order,
        lessons (
          id,
          title,
          slug,
          order
        )
      )
    `)
        .order('order', { ascending: true });

    if (error) {
        console.error('Error fetching full learning tree:', error);
        return [];
    }

    // Sort chapters and lessons
    const courses = data?.map((course) => ({
        ...course,
        chapters: (course.chapters || [])
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((chapter: any) => ({
                ...chapter,
                lessons: (chapter.lessons || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
            })),
    }));

    return courses || [];
}
