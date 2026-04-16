import { NextResponse } from "next/server";
import { getSmartCodingProblem, resetProblemHistory } from "@/lib/coding-problems-service";
import { getSession } from "@/lib/auth"; // Assuming local getSession or similar exists to get user

export async function GET(req: Request) {
    // We need the username to fetch history. 
    // Usually retrieved from session.
    const session = await getSession();
    if (!session || !session.username) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const username = session.username;

    try {
        const { problem, status } = await getSmartCodingProblem(username);
        
        if (status === 'exhausted') {
            // Reset history as requested
            await resetProblemHistory(username);
            return NextResponse.json({ 
                status: 'exhausted', 
                message: "Bạn đã làm hết bài tập mất rồi! AI Coding Guru sẽ tiếp tục cập nhật thêm nhiều dạng bài hơn nữa trong thời gian sắp tới!" 
            });
        }

        return NextResponse.json({ status: 'ok', problem });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
