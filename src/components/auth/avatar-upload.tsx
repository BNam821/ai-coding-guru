"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import Image from "next/image";

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset states
        setError("");
        setIsUploading(true);

        try {
            // 1. Validate file
            if (!file.type.startsWith("image/")) {
                throw new Error("Vui lòng chọn file ảnh hợp lệ");
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit before compression
                throw new Error("Kích thước ảnh quá lớn (tối đa 5MB)");
            }

            // 2. Compress image
            const options = {
                maxSizeMB: 0.5, // Max 500KB
                maxWidthOrHeight: 800, // Max dimension 800px
                useWebWorker: true,
                fileType: "image/webp" // Convert to WebP for better compression
            };

            const compressedFile = await imageCompression(file, options);

            // Create preview immediately
            const objectUrl = URL.createObjectURL(compressedFile);
            setPreviewUrl(objectUrl);

            // 3. Upload to Supabase Storage
            const fileExt = "webp";
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from("avatars")
                .upload(filePath, compressedFile, {
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            onUploadComplete(publicUrl);

        } catch (err: any) {
            console.error("Upload failed:", err);
            setError(err.message || "Đã có lỗi xảy ra khi tải ảnh lên");
            setPreviewUrl(currentAvatarUrl || null); // Revert preview on error
        } finally {
            setIsUploading(false);
            // Clear input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveAvatar = () => {
        setPreviewUrl(null);
        onUploadComplete(""); // Clear avatar URL
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-4">
            <label className="block text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">
                Ảnh đại diện
            </label>

            <div className="flex items-start gap-6">
                {/* Preview Circle */}
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 relative">
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt="Avatar Preview"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                <ImageIcon size={32} />
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                <Loader2 size={24} className="text-accent-primary animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Quick Remove Button */}
                    {previewUrl && !isUploading && (
                        <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-colors"
                            title="Xóa ảnh"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload size={16} />
                            {isUploading ? "Đang xử lý..." : "Tải ảnh lên"}
                        </button>
                        <p className="text-xs text-white/40">
                            Hỗ trợ JPG, PNG, WebP. Tối đa 5MB.<br />
                            Ảnh sẽ được tự động nén.
                        </p>
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 animate-in slide-in-from-left-2">
                            {error}
                        </p>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
}
