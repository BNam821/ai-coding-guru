"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LogoutButton } from "@/components/auth/logout-button";
import { EditProfileForm } from "@/components/auth/edit-profile-form";
import { DeleteAccountSection } from "@/components/auth/delete-account-section";
import { User, ShieldCheck, Mail, MapPin, UserCircle, Edit3 } from "lucide-react";

interface AccountContentProps {
    session: {
        username: string;
        role: string;
        email: string;
        displayName?: string;
        bio?: string;
    };
    stats: {
        postCount: number;
        memberCount: number;
    };
}

export function AccountContent({ session, stats }: AccountContentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const isAdmin = session?.role === "admin";

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 text-left">
            <GlassCard className="p-10 border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                    <LogoutButton />
                </div>

                {isEditing ? (
                    <EditProfileForm
                        initialData={{
                            username: session.username,
                            email: session.email,
                            displayName: session.displayName || "",
                            bio: session.bio || ""
                        }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="relative">
                                <div className={isAdmin
                                    ? "w-32 h-32 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary p-1 shadow-2xl"
                                    : "w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-1 shadow-2xl"
                                }>
                                    <div className="w-full h-full rounded-full bg-deep-space flex items-center justify-center border-4 border-white/5">
                                        {isAdmin ? (
                                            <User size={60} className="text-white" />
                                        ) : (
                                            <UserCircle size={60} className="text-white/80" />
                                        )}
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="absolute -bottom-2 -right-2 bg-accent-secondary p-2 rounded-full shadow-lg border-4 border-deep-space">
                                        <ShieldCheck size={20} className="text-black" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                        {session.displayName || session.username}
                                        {isAdmin ? (
                                            <span className="text-xs px-2 py-1 rounded bg-accent-secondary/20 text-accent-secondary font-mono">ADMIN</span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono">MEMBER</span>
                                        )}
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 hover:bg-white/5 rounded-full text-white/40 hover:text-accent-primary transition-colors ml-1"
                                            title="Chỉnh sửa thông tin"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </h2>
                                    <p className="text-white/60 text-sm mt-2 leading-relaxed italic max-w-2xl">
                                        {session.bio || (isAdmin ? "Quản trị viên cấp cao của AI Coding Guru" : "Thành viên nhiệt huyết của cộng đồng")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-white/80">
                                        <Mail size={18} className="text-accent-primary" />
                                        <span>{session.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-white/80">
                                        <MapPin size={18} className="text-accent-secondary" />
                                        <span>Quảng Ninh, Việt Nam</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">{stats.postCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">Bài viết</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">{stats.memberCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">Thành viên</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">{isAdmin ? "50%" : "12%++"}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">Tiến độ</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">v2.1</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">Phiên bản</p>
                            </div>
                        </div>
                    </>
                )}
            </GlassCard>

            {!isEditing && <DeleteAccountSection />}
        </div>
    );
}
