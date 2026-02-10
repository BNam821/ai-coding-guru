'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, Edit, Trash2 } from 'lucide-react';

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    initialData?: {
        id: string;
        title: string;
        description?: string;
    };
}

export function CourseModal({ isOpen, onClose, mode, initialData }: CourseModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const slug = title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            if (mode === 'create') {
                const res = await fetch('/api/courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, slug, description }),
                });

                const data = await res.json();
                if (!data.success) {
                    setError(data.error || 'Có lỗi xảy ra');
                    return;
                }
            } else if (mode === 'edit' && initialData?.id) {
                const res = await fetch(`/api/courses/${initialData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                });

                const data = await res.json();
                if (!data.success) {
                    setError(data.error || 'Có lỗi xảy ra');
                    return;
                }
            }

            router.refresh();
            // Notify other components that storage changed
            window.dispatchEvent(new CustomEvent('learn-structure-changed'));
            onClose();
        } catch (e) {
            setError('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0a0a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">
                    {mode === 'create' ? 'Thêm khóa học mới' : 'Đổi tên khóa học'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tên khóa học
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="VD: React cơ bản"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Mô tả (tùy chọn)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn về khóa học..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !title}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                {mode === 'create' ? <Plus className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                {mode === 'create' ? 'Tạo khóa học' : 'Lưu thay đổi'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Button to trigger create modal
export function AddCourseButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 w-full p-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/5 text-blue-400 border border-dashed border-blue-500/30 hover:border-blue-500/50"
            >
                <Plus className="w-4 h-4" />
                Thêm khóa học
            </button>

            <CourseModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                mode="create"
            />
        </>
    );
}

// Button to trigger edit modal
export function EditCourseButton({ course }: { course: { id: string; title: string; description?: string } }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-colors"
                title="Sửa thông tin"
            >
                <Edit className="w-3 h-3" />
            </button>

            <CourseModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                mode="edit"
                initialData={course}
            />
        </>
    );
}

// Button to delete course
export function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm(`Bạn có chắc chắn muốn xoá khoá học "${courseTitle}"? Hành động này sẽ xoá toàn bộ chương và bài học bên trong.`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (data.success) {
                router.push('/learn');
                router.refresh();
                // Notify other components
                window.dispatchEvent(new CustomEvent('learn-structure-changed'));
            } else {
                alert(data.error || 'Có lỗi xảy ra khi xoá');
            }
        } catch (err) {
            alert('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Xoá khoá học"
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
    );
}
