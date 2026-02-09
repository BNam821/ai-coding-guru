"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteButton({ slug }: { slug: string }) {
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm("Bạn có chắc chắn muốn xoá bài viết này không? Hành động này không thể hoàn tác.")) {
            try {
                const res = await fetch(`/api/wiki?slug=${slug}`, { method: 'DELETE' });
                const data = await res.json();

                if (data.success) {
                    window.location.reload();
                } else {
                    alert("Lỗi: " + data.error);
                }
            } catch (err) {
                alert("Đã có lỗi xảy ra khi xoá bài viết.");
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-md"
            title="Xoá bài viết"
        >
            <Trash2 size={16} />
        </button>
    );
}
