"use client";

import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminControlsProps {
    lessonId: string;
    courseSlug: string;
    lessonSlug: string;
}

export function AdminControls({ lessonId, courseSlug, lessonSlug }: AdminControlsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Bạn có chắc chắn muốn xoá bài học này không?")) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/learn/lesson?id=${lessonId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/learn");
                router.refresh();
            } else {
                alert("Xoá thất bại");
            }
        } catch (e) {
            console.error(e);
            alert("Đã có lỗi xảy ra");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
            <Link
                href={`/learn/${courseSlug}/${lessonSlug}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
            >
                <Edit size={16} />
                Sửa bài học
            </Link>

            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
                <Trash2 size={16} />
                {isDeleting ? "Đang xoá..." : "Xoá bài học"}
            </button>
        </div>
    );
}
