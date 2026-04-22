import { redirect } from "next/navigation";
import { ProblemForm } from "@/components/admin/problem-form";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function AdminAddProblemPage() {
    if (!(await isAdminAuthenticated())) {
        redirect("/test");
    }

    return (
        <main className="min-h-screen pt-32 pb-20 px-4 relative z-10">
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[150px] -z-10" />

            <div className="max-w-6xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4">
                        Thêm bài tập <span className="text-yellow-400">mới</span>
                    </h1>
                    <p className="text-gray-500 max-w-xl mx-auto">
                        Thiết kế thử thách lập trình mới. Hãy đảm bảo đề bài và output mong muốn đồng bộ hoàn toàn để AI chấm điểm chính xác.
                    </p>
                </div>

                <ProblemForm isEdit={false} />
            </div>
        </main>
    );
}
