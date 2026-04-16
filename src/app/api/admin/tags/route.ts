import { NextResponse } from "next/server";
import { getUniqueLessonTags } from "@/lib/coding-problems-service";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tags = await getUniqueLessonTags();
        return NextResponse.json(tags);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
