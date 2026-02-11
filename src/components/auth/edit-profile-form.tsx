"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { Lock, User, Mail, Eye, EyeOff, Save, ChevronRight } from "lucide-react";

import { AvatarUpload } from "@/components/auth/avatar-upload";
import { VIETNAM_PROVINCES } from "@/constants/provinces";
import { MapPin } from "lucide-react";

interface EditProfileFormProps {
    initialData: {
        username: string;
        email: string;
        displayName: string;
        bio: string;
        location?: string;
        avatarUrl?: string;
    };
    onCancel: () => void;
}

export function EditProfileForm({ initialData, onCancel }: EditProfileFormProps) {
    const [username] = useState(initialData.username);
    const [displayName, setDisplayName] = useState(initialData.displayName);
    const [email, setEmail] = useState(initialData.email);
    const [bio, setBio] = useState(initialData.bio);
    const [location, setLocation] = useState(initialData.location || "Quảng Ninh");
    const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword && newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        if (!oldPassword) {
            setError("Vui lòng nhập mật khẩu hiện tại để xác nhận");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName, email, bio, avatarUrl, location, newPassword, oldPassword }),
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.refresh();
                    onCancel();
                }, 1500);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="text-accent-primary" size={20} />
                    Chỉnh sửa thông tin
                </h3>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-accent-secondary/10 border border-accent-secondary/20 rounded-lg text-accent-secondary text-sm text-center font-medium">
                    Cập nhật thành công!
                </div>
            )}

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    onUploadComplete={setAvatarUrl}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Tên hiển thị</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <User size={16} />
                        </div>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all text-sm"
                            placeholder="Nhập tên hiển thị..."
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Tên đăng nhập (Không thể sửa)</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type="text"
                            value={username}
                            readOnly
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white/40 cursor-not-allowed focus:outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Email</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Địa chỉ (Tỉnh/Thành)</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <MapPin size={16} />
                        </div>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all text-sm appearance-none"
                        >
                            {VIETNAM_PROVINCES.map((prov) => (
                                <option key={prov} value={prov} className="bg-deep-space text-white lowercase">
                                    {prov}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                            <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Mô tả cá nhân (Bio)</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all text-sm min-h-[100px] resize-none"
                        placeholder="Giới thiệu một chút về bản thân bạn..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Mật khẩu mới (tùy chọn)</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white focus:outline-none focus:border-accent-primary/50 transition-all text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white focus:outline-none focus:border-accent-primary/50 transition-all text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-accent-secondary ml-1 uppercase tracking-widest">Xác nhận mật khẩu hiện tại</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-secondary transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-accent-secondary/50 transition-all font-bold"
                            placeholder="Nhập mật khẩu để lưu thay đổi"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <NeonButton
                        type="submit"
                        variant="primary"
                        className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        <Save size={18} />
                        {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </NeonButton>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all text-sm font-medium"
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </form>
    );
}
