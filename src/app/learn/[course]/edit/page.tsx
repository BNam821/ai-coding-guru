import { getCourseBySlug } from '@/lib/learn-db';
import { isAdminAuthenticated } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditCourseForm } from '@/components/learn/edit-course-form';

export default async function EditCoursePage({ params }: { params: { course: string } }) {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
        redirect('/learn');
    }

    const { course: courseSlug } = await params;
    const course = await getCourseBySlug(courseSlug);

    if (!course) {
        notFound();
    }

    return (
        <div className="space-y-8 relative z-10">
            {/* Back Button */}
            <Link
                href={`/learn/${courseSlug}`}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Quay lại khóa học
            </Link>

            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Chỉnh sửa khóa học</h1>
                <p className="text-gray-400">Cập nhật thông tin khóa học "{course.title}"</p>
            </div>

            {/* Edit Form */}
            <EditCourseForm course={course} />
        </div>
    );
}
