import { Edit, Trash2, Share2, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminControlsProps {
    lessonId: string;
    courseSlug: string;
    lessonSlug: string;
    isAdmin: boolean;
}

export function AdminControls({ lessonId, courseSlug, lessonSlug, isAdmin }: AdminControlsProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error(err);
        }
    };

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
        <div className="flex items-center gap-2">
            {/* Share Button (For Everyone) */}
            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium border border-white/10"
            >
                {isCopied ? (
                    <>
                        <Check size={16} className="text-green-400" />
                        Đã sao chép
                    </>
                ) : (
                    <>
                        <Share2 size={16} />
                        Chia sẻ
                    </>
                )}
            </button>

            {/* Admin Controls */}
            {isAdmin && (
                <>
                    <Link
                        href={`/learn/${courseSlug}/${lessonSlug}/edit`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium border border-blue-500/20"
                    >
                        <Edit size={16} />
                        Sửa bài học
                    </Link>

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50 border border-red-500/20"
                    >
                        <Trash2 size={16} />
                        {isDeleting ? "Đang xoá..." : "Xoá"}
                    </button>
                </>
            )}
        </div>
    );
}
