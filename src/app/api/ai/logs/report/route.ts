import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markAiInteractionReported } from "@/lib/ai-interactions";

function getReportSource(value: unknown) {
    return typeof value === "string" ? value.trim().slice(0, 80) : null;
}

export async function POST(req: Request) {
    let body: { interactionId?: unknown; source?: unknown } = {};

    try {
        body = await req.json();
    } catch {
        body = {};
    }

    const interactionId = typeof body.interactionId === "string" ? body.interactionId.trim() : "";
    if (!interactionId) {
        return NextResponse.json({ success: false, error: "Thiếu interactionId để báo cáo." }, { status: 400 });
    }

    const session = await getSession();
    const result = await markAiInteractionReported({
        interactionId,
        viewerRole: session?.role === "admin" ? "admin" : "user",
        viewerUsername: session?.username ?? null,
        reportedBy: session?.username ?? null,
        reportSource: getReportSource(body.source),
    });

    if (!result.success) {
        const status = result.reason === "forbidden" ? 403 : 404;
        const message = result.reason === "forbidden"
            ? "Bạn không có quyền báo cáo nội dung này."
            : "Không tìm thấy bản ghi AI cần báo cáo.";

        return NextResponse.json({ success: false, error: message }, { status });
    }

    return NextResponse.json({
        success: true,
        alreadyReported: result.alreadyReported === true,
        interactionId: result.interactionId,
        report: result.report,
    });
}
