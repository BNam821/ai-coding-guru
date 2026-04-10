import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('user_course_registrations')
            .select('course_id')
            .eq('username', session.username);

        if (error) {
            throw error;
        }

        const courseIds = (data || [])
            .map((row: { course_id: string | null }) => row.course_id)
            .filter((courseId): courseId is string => Boolean(courseId));

        return NextResponse.json({ success: true, courseIds });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { courseId } = await request.json();

        if (!courseId) {
            return NextResponse.json({ success: false, error: 'Missing courseId' }, { status: 400 });
        }

        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('user_course_registrations')
            .upsert({
                username: session.username,
                course_id: courseId,
                registered_at: new Date().toISOString(),
            }, { onConflict: 'username,course_id' });

        if (error) {
            throw error;
        }

        revalidatePath('/learn');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
