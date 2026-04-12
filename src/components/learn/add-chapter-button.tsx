'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddChapterButtonProps {
    courseId: string;
    variant?: 'inline' | 'primary';
    className?: string;
}

export function AddChapterButton({
    courseId,
    variant = 'primary',
    className,
}: AddChapterButtonProps) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleCreate = async () => {
        const trimmed = newTitle.trim();
        if (!trimmed) {
            setIsAdding(false);
            setNewTitle('');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/learn/chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: trimmed, course_id: courseId }),
            });
            const data = await res.json();

            if (data.success) {
                setNewTitle('');
                setIsAdding(false);
                router.refresh();
                window.dispatchEvent(new CustomEvent('learn-structure-changed'));
            } else {
                alert(data.error || 'Lỗi khi tạo chương');
            }
        } catch {
            alert('Đã có lỗi xảy ra');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setNewTitle('');
        setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleCreate();
        if (e.key === 'Escape') handleCancel();
    };

    if (!isAdding) {
        return (
            <button
                type="button"
                onClick={() => setIsAdding(true)}
                className={cn(
                    variant === 'inline'
                        ? 'flex items-center gap-1.5 px-2 py-1.5 mt-1 text-xs text-gray-600 hover:text-blue-400 hover:bg-white/5 rounded-md transition-colors w-full'
                        : 'flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors',
                    className
                )}
            >
                <Plus className={variant === 'inline' ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>Thêm chương mới</span>
            </button>
        );
    }

    return (
        <div
            className={cn(
                variant === 'inline'
                    ? 'flex items-center gap-1 px-1 mt-1'
                    : 'flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2',
                className
            )}
        >
            <input
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleCancel}
                disabled={isSaving}
                placeholder="Tên chương..."
                className={cn(
                    'min-w-0 flex-1 rounded border border-blue-500/50 bg-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400',
                    variant === 'inline' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
                )}
            />
            {isSaving ? (
                <Loader2 className={cn('text-blue-400 animate-spin shrink-0', variant === 'inline' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
            ) : (
                <>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleCreate();
                        }}
                        className="shrink-0 p-0.5 text-green-400 hover:text-green-300"
                        title="Tạo"
                    >
                        <Check className={variant === 'inline' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleCancel();
                        }}
                        className="shrink-0 p-0.5 text-red-400 hover:text-red-300"
                        title="Hủy"
                    >
                        <X className={variant === 'inline' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                    </button>
                </>
            )}
        </div>
    );
}
