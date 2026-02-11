"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function DebugSupabase() {
    const supabase = createClient();
    const [status, setStatus] = useState("Checking...");
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [bucketInfo, setBucketInfo] = useState<any>(null);
    const [uploadTest, setUploadTest] = useState<string>("");

    useEffect(() => {
        const check = async () => {
            try {
                // 1. Check Session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                setSessionInfo(session ? {
                    user: session.user.email,
                    role: session.user.role,
                    id: session.user.id
                } : "No Session (Error: " + sessionError?.message + ")");

                // 2. Check Bucket Access (Public)
                // Try to list files in 'avatars' (should work if public select policy is on)
                const { data: files, error: listError } = await supabase.storage.from("avatars").list();
                setBucketInfo(files ? `Access OK. Found ${files.length} files.` : `Access Denied: ${listError?.message}`);

            } catch (e: any) {
                setStatus("Error: " + e.message);
            }
        };
        check();
    }, []);

    const testUpload = async () => {
        setUploadTest("Uploading test file...");
        try {
            // Create a dummy file
            const blob = new Blob(["test"], { type: "text/plain" });
            const file = new File([blob], `debug-test-${Date.now()}.txt`, { type: "text/plain" });

            const { data, error } = await supabase.storage
                .from("avatars")
                .upload(file.name, file);

            if (error) {
                setUploadTest("FAILED: " + error.message + " | Details: " + JSON.stringify(error));
            } else {
                setUploadTest("SUCCESS: Uploaded " + data.path);
            }
        } catch (e: any) {
            setUploadTest("EXCEPTION: " + e.message);
        }
    };

    return (
        <div className="p-8 bg-gray-900 text-white min-h-screen space-y-6 font-mono">
            <h1 className="text-2xl font-bold text-red-400">Supabase Debugger</h1>

            <div className="bg-black/40 p-4 rounded border border-white/10">
                <h2 className="font-bold text-blue-400 mb-2">1. Session Status</h2>
                <pre className="text-sm overflow-auto text-green-300">
                    {JSON.stringify(sessionInfo, null, 2)}
                </pre>
            </div>

            <div className="bg-black/40 p-4 rounded border border-white/10">
                <h2 className="font-bold text-yellow-400 mb-2">2. Bucket Access (Public Read)</h2>
                <pre className="text-sm overflow-auto">
                    {JSON.stringify(bucketInfo, null, 2)}
                </pre>
            </div>

            <div className="bg-black/40 p-4 rounded border border-white/10">
                <h2 className="font-bold text-purple-400 mb-2">3. Upload Test</h2>
                <button
                    onClick={testUpload}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm mb-2"
                >
                    Try Upload Test File
                </button>
                <pre className="text-sm overflow-auto text-red-300">
                    {uploadTest}
                </pre>
            </div>
        </div>
    );
}
