"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LogoutButton } from "@/components/auth/logout-button";
import { EditProfileForm } from "@/components/auth/edit-profile-form";
import { DeleteAccountSection } from "@/components/auth/delete-account-section";
import { User, ShieldCheck, Mail, MapPin, UserCircle, Edit3, Settings } from "lucide-react";

interface AccountContentProps {
    session: {
        username: string;
        role: string;
        email: string;
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
                <div className="absolute top-0 right-0 p-6 flex gap-2">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-accent-primary transition-colors"
                            title="Chá»‰nh sá»a thÃ´ng tin"
                        >
                            <Edit3 size={20} />
                        </button>
                    )}
                    <LogoutButton />
                </div>

                {isEditing ? (
                    <EditProfileForm
                        initialData={{
                            username: session.username,
                            email: session.email
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
                                        {session.username}
                                        {isAdmin ? (
                                            <span className="text-xs px-2 py-1 rounded bg-accent-secondary/20 text-accent-secondary font-mono">ADMIN</span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono">MEMBER</span>
                                        )}
                                    </h2>
                                    <p className="text-white/40 text-sm mt-1">
                                        {isAdmin ? "Quáº£n trá»‹ viÃªn cáº¥p cao cá»§a AI Coding Guru" : "ThÃ nh viÃªn nhiá»‡t huyáº¿t cá»§a cá»™ng Ä‘á»“ng"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-white/80">
                                        <Mail size={18} className="text-accent-primary" />
                                        <span>{isAdmin ? "admin@campha8.dev" : "user@example.com"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-white/80">
                                        <MapPin size={18} className="text-accent-secondary" />
                                        <span>Quáº£ng Ninh, Viá»‡t Nam</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">{stats.postCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">BÃ i viáº¿t</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">{stats.memberCount}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">ThÃ nh viÃªn</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">{isAdmin ? "50%" : "12%++"}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">Tiáº¿n Ä‘á»™</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-white">v2.1</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40">PhiÃªn báº£n</p>
                            </div>
                        </div>
                    </>
                )}
            </GlassCard>

            {!isEditing && <DeleteAccountSection />}
        </div>
    );
}
