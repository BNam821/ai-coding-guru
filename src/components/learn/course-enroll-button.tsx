'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseEnrollButtonProps {
    courseId: string;
    isLoggedIn: boolean;
    initialRegistered: boolean;
}

export function CourseEnrollButton({ courseId, isLoggedIn, initialRegistered }: CourseEnrollButtonProps) {
    const router = useRouter();
    const [isRegistered, setIsRegistered] = useState(initialRegistered);
    const [isLoading, setIsLoading] = useState(false);

    const handleEnroll = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isLoading || isRegistered) {
            return;
        }

        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/learn/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });

            const data = await response.json();
            if (data.success) {
                setIsRegistered(true);
                router.refresh();
                return;
            }

            if (data.error === 'Unauthorized') {
                router.push('/login');
                return;
            }

            alert(data.error || 'Không thể đăng ký khóa học');
        } catch {
            alert('Đã có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleEnroll}
            disabled={isLoading || isRegistered}
            className={cn(
                'inline-flex min-w-[110px] items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                isRegistered
                    ? 'cursor-default border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-blue-400/35 bg-blue-500/20 text-blue-200 hover:border-blue-300/60 hover:bg-blue-500/30',
                isLoading && 'cursor-wait',
            )}
        >
            {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang đăng ký
                </span>
            ) : (
                <span>{isRegistered ? 'Đã đăng ký' : 'Đăng ký'}</span>
            )}
        </button>
    );
}
